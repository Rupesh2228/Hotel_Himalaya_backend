const nodemailer = require('nodemailer');
const adminEmail = (process.env.ADMIN_EMAIL || process.env.GOOGLE_ADMIN_EMAIL || 'admin@example.com').toLowerCase();
const senderEmail = process.env.SMTP_EMAIL;
const senderPassword = process.env.SMTP_PASSWORD;

let transporter = null;

const getTransporter = () => {
  if (!transporter && senderEmail && senderPassword) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: senderPassword,
      },
    });
  }
  return transporter;
};

/**
 * Send an email alert to the admin email only.
 * Fire-and-forget — logs errors but never throws.
 *
 * @param {string} subject - Email subject line
 * @param {string} body - Plain text body
 * @param {string} [htmlBody] - Optional HTML body for rich formatting
 */
const sendAdminEmail = async (subject, body, htmlBody) => {
  try {
    const mailer = getTransporter();
    if (!mailer) {
      console.warn('[EMAIL] Not configured — skipping email. Check SMTP_EMAIL and SMTP_PASSWORD in .env');
      return null;
    }

    const mailOptions = {
      from: `"Hotel Khokana" <${senderEmail}>`,
      to: adminEmail,
      subject: subject,
      text: body,
    };

    if (htmlBody) {
      mailOptions.html = htmlBody;
    }

    const info = await mailer.sendMail(mailOptions);
    console.log(`[EMAIL] Admin alert sent successfully. ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[EMAIL] Failed to send admin alert:', error.message);
    return null;
  }
};

const sendEmail = async (to, subject, body, htmlBody) => {
  try {
    const mailer = getTransporter();
    if (!mailer) {
      console.warn('[EMAIL] Not configured — skipping email. Check SMTP_EMAIL and SMTP_PASSWORD in .env');
      return null;
    }

    const mailOptions = {
      from: `"Hotel Khokana" <${senderEmail}>`,
      to: to,
      subject: subject,
      text: body,
    };

    if (htmlBody) {
      mailOptions.html = htmlBody;
    }

    const info = await mailer.sendMail(mailOptions);
    console.log(`[EMAIL] Email to ${to} sent successfully. ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL] Failed to send email to ${to}:`, error.message);
    return null;
  }
};

module.exports = { sendAdminEmail, sendEmail };
