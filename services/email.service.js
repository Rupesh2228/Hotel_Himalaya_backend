const { brevoClient } = require('../config/brevo');
const nodemailer = require('nodemailer');

const sendWithSmtp = async (to, subject, text, html) => {
  const senderEmail = (process.env.SMTP_EMAIL || '').trim();
  const senderPassword = (process.env.SMTP_PASSWORD || '').trim();

  if (!senderEmail || !senderPassword) {
    console.warn('[EMAIL] Skipping email — set BREVO_API_KEY or SMTP_EMAIL and SMTP_PASSWORD.');
    return null;
  }

  const adminEmail = (process.env.ADMIN_EMAIL || process.env.GOOGLE_ADMIN_EMAIL || '').trim();
  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || 'gmail',
    auth: { user: senderEmail, pass: senderPassword },
  });

  const data = await transporter.sendMail({
    from: { name: 'Hotel Himalaya INN', address: senderEmail },
    to,
    replyTo: adminEmail || undefined,
    subject,
    text,
    html: html || `<html><body>${text}</body></html>`,
  });
  console.log(`[EMAIL] Sent to ${to} through SMTP — Message ID: ${data.messageId}`);
  return data;
};

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
      return await sendWithSmtp(to, subject, text, html);
    }

    const senderEmail = (process.env.SMTP_EMAIL || 'noreply@hotelhimalaya.com').trim();
    const senderName = 'Hotel Himalaya INN';
    const adminEmail = (process.env.ADMIN_EMAIL || process.env.GOOGLE_ADMIN_EMAIL || '').trim();

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
    ''
  ).trim().toLowerCase();

  if (!adminEmail) {
    console.warn('[EMAIL] Cannot send admin email — ADMIN_EMAIL is not set in environment.');
    return null;
  }

  return sendEmail(adminEmail, subject, text, html);
};

module.exports = { sendEmail, sendAdminEmail };
