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
  try {
    const adminUsers = await User.find({ role: 'admin', isVerified: true }).select('email').lean();
    const recipients = adminUsers.map((admin) => admin.email?.trim().toLowerCase()).filter(Boolean);
    console.log('[ADMIN-RECIPIENTS] Found admin users from database:', recipients);

    // Keep the configured main admin as a fallback while older user records are migrated.
    const configuredAdmin = (process.env.ADMIN_EMAIL || process.env.GOOGLE_ADMIN_EMAIL || '')
      .trim()
      .toLowerCase();
    
    if (configuredAdmin) {
      recipients.push(configuredAdmin);
      console.log('[ADMIN-RECIPIENTS] Added configured admin:', configuredAdmin);
    }

    const uniqueRecipients = [...new Set(recipients)];
    console.log('[ADMIN-RECIPIENTS] Final unique recipients:', uniqueRecipients);
    return uniqueRecipients;
  } catch (err) {
    console.error('[ADMIN-RECIPIENTS] Error fetching admin recipients:', err);
    // Fallback to configured admin even if database query fails
    const configuredAdmin = (process.env.ADMIN_EMAIL || process.env.GOOGLE_ADMIN_EMAIL || '')
      .trim()
      .toLowerCase();
    if (configuredAdmin) {
      console.log('[ADMIN-RECIPIENTS] Using fallback configured admin:', configuredAdmin);
      return [configuredAdmin];
    }
    return [];
  }
};

/**
 * Notify other admins that an admin has logged in (security alert).
 * Excludes the admin who just logged in from the recipients list.
 */
const notifyAdminLogin = async ({ adminName, adminEmail, loginDetails }) => {
  try {
    const allRecipients = await getAdminEmailRecipients();
    // Exclude the admin who just logged in from notifications
    const otherAdmins = allRecipients.filter(email => email !== adminEmail?.toLowerCase());

    if (otherAdmins.length === 0) {
      console.log('[ADMIN-LOGIN-NOTIFICATION] No other admins to notify');
      return;
    }

    const adminLoginTemplate = require('../templates/adminLogin.template');
    const subject = `🔐 Admin Login: ${adminName}`;
    const body = `${adminName} logged into the admin dashboard.`;
    const html = adminLoginTemplate(adminName, adminEmail, loginDetails);

    console.log('[ADMIN-LOGIN-NOTIFICATION] Sending login alerts to', otherAdmins.length, 'admin(s)');
    const results = await Promise.allSettled(
      otherAdmins.map((email) => sendEmail(email, subject, body, html))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`[ADMIN-LOGIN-NOTIFICATION] Successfully sent to ${otherAdmins[index]}`);
      } else {
        console.error(`[ADMIN-LOGIN-NOTIFICATION] Failed to send to ${otherAdmins[index]}:`, result.reason);
      }
    });
  } catch (e) {
    console.error('[ADMIN-LOGIN-NOTIFICATION] Error:', e && e.message ? e.message : e);
  }
};

/**
 * Create a notification for all admins and optionally send them an email.
 * This is fire-and-forget; errors are logged but not thrown.
 */
/**
 * Create a notification for all admins and optionally send them an email.
 * This is fire-and-forget; errors are logged but not thrown.
 */
const createAdminNotification = async ({ type, title, message, link, sendEmail: shouldSendEmail = true, details = {} }) => {
  try {
    await Notification.create({ type, title, message, link });
    console.log('[NOTIFICATION] Created admin notification in database:', type);
  } catch (err) {
    console.error('[NOTIFICATION] Failed to create admin notification:', err && err.message ? err.message : err);
  }

  if (shouldSendEmail) {
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
      console.log('[NOTIFICATION-EMAIL] Recipients for sending:', recipients);

      if (!recipients.length) {
        console.warn('[EMAIL] Cannot send admin alert — no administrator email is configured.');
        return;
      }

      console.log('[NOTIFICATION-EMAIL] Sending notification email to', recipients.length, 'recipients');
      const results = await Promise.allSettled(
        recipients.map((email) => sendEmail(email, subject, body, html))
      );
      
      // Log the results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`[NOTIFICATION-EMAIL] Successfully sent to ${recipients[index]}`);
        } else {
          console.error(`[NOTIFICATION-EMAIL] Failed to send to ${recipients[index]}:`, result.reason);
        }
      });
    } catch (e) {
      console.error('[NOTIFICATION-EMAIL] Failed to send admin notification email:', e && e.message ? e.message : e);
    }
  }

  try {
    await sendPushNotifications({ title, message, link });
  } catch (error) {
    console.error('[PUSH-NOTIFICATION] Failed to send device notifications:', error.message);
  }
};

module.exports = { createAdminNotification };
