const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('./email.service');
const adminNotificationTemplate = require('../templates/adminNotification.template');
const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

const sendPushNotifications = async ({ title, message, link }) => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@hotelhimalaya.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  const subscriptions = await PushSubscription.find();
  const payload = JSON.stringify({ title, body: message, link: link || '/hh-cp-9f3m2q' });
  await Promise.allSettled(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      }, payload);
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await PushSubscription.deleteOne({ _id: subscription._id });
      }
      throw error;
    }
  }));
};

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

  try {
    await sendPushNotifications({ title, message, link });
  } catch (error) {
    console.error('Failed to send device notifications:', error.message);
  }
};

module.exports = { createAdminNotification };
