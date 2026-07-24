const { brevoClient } = require('../config/brevo');

/**
 * Send an email using Brevo v6 BrevoClient API.
 * Returns the response on success, or null on failure.
 *
 * @param {string} to        - Recipient email address
 * @param {string} subject   - Email subject line
 * @param {string} text      - Plain-text body (fallback)
 * @param {string} html      - HTML body
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn('[EMAIL] Skipping email — BREVO_API_KEY is not set.');
      return null;
    }

    const senderEmail = (process.env.SMTP_EMAIL || 'noreply@hotelhimalaya.com').trim();
    const senderName = 'Hotel Himalaya INN';
    const adminEmail = (process.env.ADMIN_EMAIL || process.env.GOOGLE_ADMIN_EMAIL || 'admin@hotelhimalaya.com').trim();

    const data = await brevoClient.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html || `<html><body>${text}</body></html>`,
      textContent: text,
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      replyTo: { name: 'Support', email: adminEmail }
    });

    console.log(`[EMAIL] Sent to ${to} — Message ID: ${data.messageId}`);
    return data;
  } catch (error) {
    console.error(`[EMAIL] Failed to send email to ${to}:`, error?.response?.body || error.message);
    return null;
  }
};

/**
 * Send an email alert to the admin only.
 *
 * @param {string} subject   - Email subject line
 * @param {string} text      - Plain-text body
 * @param {string} html      - HTML body
 */
const sendAdminEmail = async (subject, text, html) => {
  const adminEmail = (
    process.env.ADMIN_EMAIL ||
    process.env.GOOGLE_ADMIN_EMAIL ||
    'admin@example.com'
  ).trim().toLowerCase();

  return sendEmail(adminEmail, subject, text, html);
};

module.exports = { sendEmail, sendAdminEmail };
