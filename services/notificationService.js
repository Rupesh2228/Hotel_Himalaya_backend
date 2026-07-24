const Notification = require('../models/Notification');
const { sendAdminEmail } = require('./email.service');
const adminNotificationTemplate = require('../templates/adminNotification.template');

/**
 * Create a notification for the admin and optionally send an email.
 * This is fire-and-forget; errors are logged but not thrown.
 */
const createAdminNotification = async ({ type, title, message, link, sendEmail = true, details = {} }) => {
  try {
    await Notification.create({ type, title, message, link });
  } catch (err) {
    console.error('Failed to create admin notification:', err && err.message ? err.message : err);
  }

  if (sendEmail) {
    try {
      const subject = `${title}`;
      const body = `${message}\n${link ? `Link: ${link}` : ''}`;
      
      const emailDetails = {
        'Message': message,
        ...details
      };
      
      if (link) {
        emailDetails['Link'] = link;
      }
      
      const html = adminNotificationTemplate(title, emailDetails);
      sendAdminEmail(subject, body, html).catch(() => {});
    } catch (e) {
      console.error('Failed to send admin notification email:', e && e.message ? e.message : e);
    }
  }
};

module.exports = { createAdminNotification };
