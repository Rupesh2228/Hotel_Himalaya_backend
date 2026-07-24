const Message = require('../models/Message');
const { sendEmail } = require('../services/email.service');
const { createAdminNotification } = require('../services/notificationService');
const contactTemplate = require('../templates/contact.template');

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

    // Send auto-reply to customer
    if (newMessage.email) {
      const emailSubject = `We've received your message — Hotel Himalaya INN`;
      const emailHtml = contactTemplate(newMessage.name);
      sendEmail(newMessage.email, emailSubject, '', emailHtml).catch(e => console.error('Failed to send contact auto-reply to customer:', e));
    }

    // Create admin notification (DB + Email)
    try {
      createAdminNotification({
        type: 'message',
        title: `New Contact Message: ${newMessage.name}`,
        message: `${newMessage.name} (${newMessage.email}) sent a new message.`,
        link: `/admin/messages/${newMessage._id}`,
        sendEmail: true,
        details: {
          'Name': newMessage.name,
          'Email': newMessage.email,
          'Phone': newMessage.phone || 'N/A',
          'Message': newMessage.message
        }
      });
    } catch (e) {
      console.error('Failed to queue admin message notification:', e && e.message ? e.message : e);
    }

    res.status(201).json({ message: 'Message sent successfully', data: newMessage });
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
