const Notification = require('../models/Notification');
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

/**
 * Create a notification in database only. Email alerts are disabled.
 * Push notifications are still sent if configured.
 */
const createAdminNotification = async ({ type, title, message, link, details = {} }) => {
  try {
    await Notification.create({ type, title, message, link });
    console.log('[NOTIFICATION] Created notification in database:', type);
  } catch (err) {
    console.error('[NOTIFICATION] Failed to create notification:', err && err.message ? err.message : err);
  }

  try {
    await sendPushNotifications({ title, message, link });
  } catch (error) {
    console.error('[PUSH-NOTIFICATION] Failed to send device notifications:', error.message);
  }
};

/**
 * Admin login notification disabled - no email alerts.
 */
const notifyAdminLogin = async ({ adminName, adminEmail, loginDetails }) => {
  console.log(`[ADMIN-LOGIN] Admin logged in: ${adminName} (${adminEmail})`);
};

module.exports = { createAdminNotification, notifyAdminLogin };
