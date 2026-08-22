const nodemailer = require('nodemailer');
const User = require('../models/User');

// Create Transporter dynamically to pick up any environment variable changes
const getTransporter = () => {
  const user = process.env.SMTP_EMAIL;
  // Strip whitespace from app password (Gmail app passwords sometimes have spaces)
  const pass = (process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');

  if (!user || !pass) {
    console.warn('[EMAIL] SMTP email or password not configured. Email service will run in MOCK mode.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass
    },
    connectionTimeout: 10000
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
 * Send an email to all approved administrators in the database.
 */
const sendAdminEmail = async (subject, text, html) => {
  try {
    // Find all approved admins (role: 'admin')
    const approvedAdmins = await User.find({ role: 'admin' }).select('email');
    
    if (!approvedAdmins || approvedAdmins.length === 0) {
      console.warn('[EMAIL-WARNING] No approved admins found in database. Admin email notification skipped.');
      return false;
    }
    
    const adminEmails = approvedAdmins.map(admin => admin.email).filter(Boolean);
    
    if (adminEmails.length === 0) {
      console.warn('[EMAIL-WARNING] Approved admins have empty emails. Admin email notification skipped.');
      return false;
    }
    
    console.log(`[EMAIL] Sending admin email notifications to ${adminEmails.length} approved admin(s): ${adminEmails.join(', ')}`);
    
    // Send to all approved admins concurrently
    const sendPromises = adminEmails.map(email => sendEmail(email, subject, text, html));
    await Promise.all(sendPromises);
    return true;
  } catch (error) {
    console.error('[EMAIL-ERROR] Failed to query approved admins or send admin emails:', error.message || error);
    return false;
  }
};

module.exports = { sendEmail, sendAdminEmail };
