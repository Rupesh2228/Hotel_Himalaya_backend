const { brevoClient } = require('../config/brevo');
const nodemailer = require('nodemailer');

const sendWithSmtp = async (to, subject, text, html) => {
  console.log('[EMAIL] Email sending disabled - skipping:', to);
  return null;
};

/**
 * Email sending is disabled.
 */
const sendEmail = async (to, subject, text, html) => {
  console.log('[EMAIL] Email sending disabled - skipping message to:', to);
  return null;
};

/**
 * Email sending is disabled.
 */
const sendAdminEmail = async (subject, text, html) => {
  console.log('[EMAIL] Email sending disabled - skipping admin notification');
  return null;
};

module.exports = { sendEmail, sendAdminEmail };
