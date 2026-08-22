const nodemailer = require('nodemailer');
const User = require('../models/User');

let cachedTransporter = null;

// Create Transporter dynamically to pick up any environment variable changes
const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.SMTP_EMAIL;
  // Strip whitespace from app password (Gmail app passwords sometimes have spaces)
  const pass = (process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');

  if (!user || !pass) {
    console.warn('[EMAIL] SMTP email or password not configured. Email service will run in MOCK mode.');
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    auth: {
      user,
      pass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });

  return cachedTransporter;
};

/**
 * Send an email using configured SMTP transporter.
 * Returns true if sent, false otherwise. Never throws.
 */
const sendEmail = async (to, subject, text, html) => {
  if (!to || !to.includes('@')) {
    console.warn('[EMAIL-SKIP] Invalid or empty recipient email:', to);
    return false;
  }

  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[EMAIL-MOCK] Send to "${to}" | Subject: "${subject}" | Content: ${text || '(HTML)'}`);
      return false;
    }

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Hotel Himalaya INN'}" <${process.env.SMTP_EMAIL}>`,
      to: to.trim(),
      subject,
      text,
      html
    });

    console.log(`[EMAIL] Sent successfully to ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[EMAIL-ERROR] Failed to send email to:', to, 'Error:', error.message || error);
    return false;
  }
};

/**
 * Send an email to all approved administrators in the database.
 */
const sendAdminEmail = async (subject, text, html) => {
  try {
    // Find all approved admins (role: 'admin')
    const approvedAdmins = await User.find({ role: 'admin' }).select('email');
    const adminEmails = (approvedAdmins || []).map(admin => admin.email?.trim()).filter(Boolean);

    if (process.env.ADMIN_EMAIL && !adminEmails.includes(process.env.ADMIN_EMAIL.trim())) {
      adminEmails.push(process.env.ADMIN_EMAIL.trim());
    }

    if (adminEmails.length === 0) {
      console.warn('[EMAIL-WARNING] No approved admins found. Admin email notification skipped.');
      return false;
    }

    console.log(`[EMAIL] Sending admin email notifications to ${adminEmails.length} admin(s): ${adminEmails.join(', ')}`);

    for (const email of adminEmails) {
      await sendEmail(email, subject, text, html);
    }
    return true;
  } catch (error) {
    console.error('[EMAIL-ERROR] Failed to send admin emails:', error.message || error);
    return false;
  }
};

module.exports = { sendEmail, sendAdminEmail };
