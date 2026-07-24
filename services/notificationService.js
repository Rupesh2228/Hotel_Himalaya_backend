const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('./email.service');
const adminNotificationTemplate = require('../templates/adminNotification.template');

const getAdminEmailRecipients = async () => {
  const adminUsers = await User.find({ role: 'admin', isVerified: true }).select('email').lean();
  const recipients = adminUsers.map((admin) => admin.email?.trim().toLowerCase()).filter(Boolean);

  // Keep the configured main admin as a fallback while older user records are migrated.
  const configuredAdmin = (process.env.ADMIN_EMAIL || process.env.GOOGLE_ADMIN_EMAIL || '')
    .trim()
    .toLowerCase();
  if (configuredAdmin) recipients.push(configuredAdmin);

  return [...new Set(recipients)];
};

/**
 * Create a notification for all admins and optionally send them an email.
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
      const recipients = await getAdminEmailRecipients();

      if (!recipients.length) {
        console.warn('[EMAIL] Cannot send admin alert — no administrator email is configured.');
        return;
      }

      await Promise.allSettled(
        recipients.map((email) => sendEmail(email, subject, body, html))
      );
    } catch (e) {
      console.error('Failed to send admin notification email:', e && e.message ? e.message : e);
    }
  }
};

module.exports = { createAdminNotification };
