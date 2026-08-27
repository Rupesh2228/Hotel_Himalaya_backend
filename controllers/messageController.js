const Message = require('../models/Message');
const { createAdminNotification } = require('../services/notificationService');
const { sendAdminEmail } = require('../services/email.service');
const adminNotificationTemplate = require('../templates/adminNotification.template');

exports.createMessage = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const newMessage = await Message.create({
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim(),
      message: message.trim(),
    });

    // Respond immediately to the client
    res.status(201).json({ message: 'Message sent successfully', data: newMessage });

    // Run notifications and emails in background
    (async () => {
      // 1. Admin push/socket notification
      try {
        await createAdminNotification({
          type: 'message',
          title: `New Contact Message from ${newMessage.name}`,
          message: `${newMessage.name} (${newMessage.email}) sent a new message.`,
          link: `/admin/messages/${newMessage._id}`,
        });
      } catch (e) {
        console.error('Failed to queue admin message notification:', e && e.message ? e.message : e);
      }

      // 2. Admin notification email
      try {
        const details = {
          'Sender Name': newMessage.name,
          'Email Address': newMessage.email,
          'Phone Number': newMessage.phone || 'N/A',
          'Message': newMessage.message,
          'Submitted At': new Date(newMessage.createdAt).toLocaleString('en-NP', { timeZone: 'Asia/Kathmandu' })
        };
        const adminHtml = adminNotificationTemplate('message', details);
        await sendAdminEmail(
          `📩 New Contact Message from ${newMessage.name}`,
          `${newMessage.name} (${newMessage.email}) sent a contact message: ${newMessage.message.slice(0, 200)}`,
          adminHtml
        );
      } catch (adminEmailErr) {
        console.error('[EMAIL-ERROR] Admin contact message email failed:', adminEmailErr.message);
      }
    })().catch((bgErr) => console.error('[MESSAGE-BG-ERROR]', bgErr.message));
  } catch (error) {
    console.error('createMessage error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('getMessages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Message.findByIdAndUpdate(id, { isRead: true }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Message not found' });
    res.json(updated);
  } catch (error) {
    console.error('markMessageRead error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('deleteMessage error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
