const nodemailer = require('nodemailer');

// ─── Create transporter once at startup using environment variables ────────────
// On deployed servers (Render, Heroku, etc.) env vars are injected at process
// startup — there is no .env file on disk, so we read directly from process.env.

let _transporter = null;
let _transporterEmail = null;

const getTransporter = () => {
  const email = (process.env.SMTP_EMAIL || '').trim();
  const pass  = (process.env.SMTP_PASSWORD || '').trim();

  if (!email || !pass) {
    console.warn('[EMAIL] SMTP_EMAIL or SMTP_PASSWORD is not set in environment variables.');
    return null;
  }

  // Re-create only if credentials have changed (supports hot config updates locally)
  if (_transporter && _transporterEmail === email) {
    return _transporter;
  }

  _transporterEmail = email;
  _transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: email,
      pass: pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  console.log(`[EMAIL] Transporter initialised for ${email}`);
  return _transporter;
};

/**
 * Send an email to any recipient.
 * Returns the Nodemailer info object on success, or null on failure.
 *
 * @param {string} to        - Recipient email address
 * @param {string} subject   - Email subject line
 * @param {string} text      - Plain-text body
 * @param {string} [html]    - Optional HTML body
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const mailer = getTransporter();

    if (!mailer) {
      console.warn(`[EMAIL] Skipping email to ${to} — transporter not configured.`);
      return null;
    }

    const senderEmail = (process.env.SMTP_EMAIL || '').trim();

    const mailOptions = {
      from: `"Hotel Himalaya INN" <${senderEmail}>`,
      to,
      subject,
      text,
    };

    if (html) {
      mailOptions.html = html;
    }

    const info = await mailer.sendMail(mailOptions);
    console.log(`[EMAIL] Sent to ${to} — Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    // Log full error so it appears in server/Render logs
    console.error(`[EMAIL] Failed to send email to ${to}:`, error.message);
    console.error('[EMAIL] Full error:', error);
    return null;
  }
};

/**
 * Send an email alert to the admin only.
 *
 * @param {string} subject   - Email subject line
 * @param {string} text      - Plain-text body
 * @param {string} [html]    - Optional HTML body
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
