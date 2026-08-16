const nodemailer = require('nodemailer');
const User = require('../models/User');

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
