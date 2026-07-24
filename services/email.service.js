const { brevo, transactionalEmailsApi } = require('../config/brevo');

/**
 * Send an email to any recipient using Brevo Transactional Email API.
 * Returns the response info on success, or null on failure.
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

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html || `<html><body>${text}</body></html>`;
    sendSmtpEmail.textContent = text;
    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.to = [{ email: to }];
    
    // Add Reply-To if you want support emails to go to admin
    const adminEmail = (process.env.ADMIN_EMAIL || process.env.GOOGLE_ADMIN_EMAIL || 'admin@hotelhimalaya.com').trim();
    sendSmtpEmail.replyTo = { name: 'Support', email: adminEmail };

    const data = await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
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
