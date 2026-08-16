const nodemailer = require('nodemailer');

// Create Transporter dynamically to pick up any environment variable changes
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    console.warn('[EMAIL] SMTP host, email, or password environment variables not configured. Email service will run in MOCK mode.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  });
};

/**
 * Send an email using configured SMTP transporter.
 * Returns true if sent, false otherwise. Never throws.
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[EMAIL-MOCK] Send to "${to}" | Subject: "${subject}" | Content: ${text || '(HTML)'}`);
      return false;
    }

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Hotel Himalaya INN'}" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      text,
      html
    });

    console.log('[EMAIL] Sent successfully. MessageId:', info.messageId);
    return true;
  } catch (error) {
    console.error('[EMAIL-ERROR] Failed to send email to:', to, 'Error:', error.message || error);
    return false;
  }
};

/**
 * Send an email to the configured administrator.
 */
const sendAdminEmail = async (subject, text, html) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('[EMAIL-WARNING] ADMIN_EMAIL env variable not set. Admin email notification skipped.');
    return false;
  }
  return sendEmail(adminEmail, subject, text, html);
};

module.exports = { sendEmail, sendAdminEmail };
