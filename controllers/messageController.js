const Message = require('../models/Message');
const { sendAdminEmail } = require('../services/emailService');

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

    // Send Email alert to admin (fire-and-forget)
    const emailBody =
      `📩 New Contact Message!\n` +
      `From: ${newMessage.name} (${newMessage.email})\n` +
      `Phone: ${newMessage.phone || 'Not provided'}\n` +
      `Message: ${newMessage.message}`;

    // Send Email alert to admin (fire-and-forget)
    const emailSubject = `📩 New Message from ${newMessage.name}`;
    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
        <div style="background:#0f3460;color:#fff;padding:20px 24px">
          <h2 style="margin:0">📩 New Contact Message</h2>
        </div>
        <div style="padding:24px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#666">Name</td><td style="padding:8px 0;font-weight:bold">${newMessage.name}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${newMessage.email}">${newMessage.email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#666">Phone</td><td style="padding:8px 0">${newMessage.phone || 'Not provided'}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f8f9fa;border-radius:6px;border-left:4px solid #0f3460">
            <p style="margin:0;color:#333">${newMessage.message}</p>
          </div>
        </div>
        <div style="background:#f5f5f5;padding:12px 24px;font-size:12px;color:#999">Hotel Khokana — Automatic Alert System</div>
      </div>`;

    sendAdminEmail(emailSubject, emailBody, emailHtml);

    // Create admin notification
    try {
      const { createAdminNotification } = require('../services/notificationService');
      createAdminNotification({
        type: 'message',
        title: `New Message from ${newMessage.name}`,
        message: `${newMessage.name} (${newMessage.email}) sent a new message.`,
        link: `/admin/messages/${newMessage._id}`,
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
