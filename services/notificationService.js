const Notification = require('../models/Notification');
const { sendAdminEmail } = require('./emailService');

/**
 * Create a notification for the admin and optionally send an email.
 * This is fire-and-forget; errors are logged but not thrown.
 */
const createAdminNotification = async ({ type, title, message, link, sendEmail = true }) => {
  try {
    await Notification.create({ type, title, message, link });
  } catch (err) {
    console.error('Failed to create admin notification:', err && err.message ? err.message : err);
  }

  if (sendEmail) {
    try {
      const subject = `${title}`;
      const body = `${message}\n${link ? `Link: ${link}` : ''}`;
      const html = `<p>${message}</p>${link ? `<p><a href="${link}">Open</a></p>` : ''}`;
      sendAdminEmail(subject, body, html).catch(() => {});
    } catch (e) {
      console.error('Failed to send admin notification email:', e && e.message ? e.message : e);
    }
  }
};

module.exports = { createAdminNotification };
