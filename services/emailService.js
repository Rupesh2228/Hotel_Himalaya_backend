const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

let transporter = null;

const getTransporter = () => {
  // Dynamically parse .env to pick up changes without needing a server restart
  const envPath = path.resolve(process.cwd(), '.env');
  let email = process.env.SMTP_EMAIL;
  let pass = process.env.SMTP_PASSWORD;

  if (fs.existsSync(envPath)) {
    const parsedEnv = dotenv.parse(fs.readFileSync(envPath));
    if (parsedEnv.SMTP_EMAIL) email = parsedEnv.SMTP_EMAIL;
    if (parsedEnv.SMTP_PASSWORD) pass = parsedEnv.SMTP_PASSWORD;
  }
  
  // Re-create transporter if credentials changed (useful for hot-reloads)
  if (email && pass) {
    if (!transporter || transporter.options.auth.user !== email) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: email,
          pass: pass,
        },
      });
    }
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
    
    // Dynamically parse ADMIN_EMAIL from .env if needed
    const envPath = path.resolve(process.cwd(), '.env');
    let adminEmail = (process.env.ADMIN_EMAIL || process.env.GOOGLE_ADMIN_EMAIL || 'admin@example.com').toLowerCase();
    if (fs.existsSync(envPath)) {
      const parsedEnv = dotenv.parse(fs.readFileSync(envPath));
      if (parsedEnv.ADMIN_EMAIL) adminEmail = parsedEnv.ADMIN_EMAIL.toLowerCase();
    }
    
    if (!mailer) {
      console.warn('[EMAIL] Not configured — skipping email. Check SMTP_EMAIL and SMTP_PASSWORD in .env');
      return null;
    }
    
    const senderEmail = mailer.options.auth.user;

    const mailOptions = {
      from: `"Hotel Himalaya INN Khona Khona INN Khona" <${senderEmail}>`,
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

    const senderEmail = mailer.options.auth.user;

    const mailOptions = {
      from: `"Hotel Himalaya INN Khona Khona INN Khona" <${senderEmail}>`,
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
