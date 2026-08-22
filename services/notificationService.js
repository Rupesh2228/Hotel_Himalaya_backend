const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');
const webpush = require('web-push');
const { emitToAdmins } = require('../config/socket');

const sendPushNotifications = async ({ title, message, link, bookingId }) => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('[PUSH-MOCK] VAPID keys not configured - skipping web push');
    return;
  }
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:maharjan2228rupesh@gmail.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    // Retrieve only approved admins to prevent push messages to pending/rejected/disabled users
    const approvedAdmins = await User.find({ role: 'admin' }).select('_id');
    const adminIds = approvedAdmins.map(admin => admin._id);

    // Find subscriptions belonging to approved admins
    const subscriptions = await PushSubscription.find({
      $or: [
        { userId: { $in: adminIds } },
        { adminId: { $in: adminIds } }
      ]
    });

    const payload = JSON.stringify({
      title,
      body: message,
      link: link || '/hh-cp-9f3m2q',
      bookingId
    });
    
    await Promise.allSettled(subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        }, payload);
      } catch (error) {
        // Cleanup invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: subscription._id });
          console.log('[PUSH-CLEANUP] Removed invalid/expired push subscription:', subscription.endpoint);
        } else {
          console.error('[PUSH-NOTIFICATION] Error sending to endpoint:', subscription.endpoint, error.message);
        }
      }
    }));
  } catch (err) {
    console.error('[PUSH-NOTIFICATION-ERROR] Failed to process web push:', err.message);
  }
};

/**
 * Create a notification in database, emit Socket.IO, and send Web Push notifications.
 */
const createAdminNotification = async ({ type, title, message, link, bookingId, recipientAdminId }) => {
  let created = null;
  try {
    created = await Notification.create({
      type,
      title,
      message,
      link,
      read: false,
      isRead: false,
      bookingId,
      recipientAdminId
    });
    console.log('[NOTIFICATION] Created notification in database:', type);
  } catch (err) {
    console.error('[NOTIFICATION] Failed to create notification:', err && err.message ? err.message : err);
  }

  // Socket.IO Emission
  try {
    emitToAdmins('new_notification', created || { type, title, message, link, bookingId, isRead: false, read: false, createdAt: new Date() });
  } catch (socketErr) {
    console.error('[SOCKET-EMIT-ERROR] Failed to emit Socket.IO event:', socketErr.message);
  }

  // Web Push Notification
  try {
    await sendPushNotifications({ title, message, link, bookingId });
  } catch (pushErr) {
    console.error('[PUSH-NOTIFICATION-ERROR] Failed to send push:', pushErr.message);
  }

  return created;
};

/**
 * Admin login notification
 */
const notifyAdminLogin = async ({ adminName, adminEmail, loginDetails }) => {
  console.log(`[ADMIN-LOGIN] Admin logged in: ${adminName} (${adminEmail})`);
};

module.exports = { createAdminNotification, notifyAdminLogin, sendPushNotifications };
