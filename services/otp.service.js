const { sendEmail } = require('./email.service');
const otpTemplate = require('../templates/otp.template');
const resetPasswordSuccessTemplate = require('../templates/resetPassword.template');
const welcomeTemplate = require('../templates/welcome.template');

/**
 * Generate a cryptographically random 6-digit OTP.
 */
const generateOTP = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

/**
 * Send an OTP verification email to a newly registered user.
 */
const sendOTPEmail = async (email, name, otp) => {
  const subject = "Verify Your Email — Hotel Himalaya INN";
  const text = \`Hello \${name},\n\nYour verification code is: \${otp}\n\nThis code expires in 5 minutes.\n\nDo not share this OTP with anyone.\n\nRegards,\nHotel Himalaya INN\`;
  const html = otpTemplate(otp, 'verification');
  return sendEmail(email, subject, text, html);
};

/**
 * Send a password-reset OTP email.
 */
const sendPasswordResetEmail = async (email, name, otp) => {
  const subject = "Password Reset Request — Hotel Himalaya INN";
  const text = \`Hello \${name},\n\nYour password reset code is: \${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, ignore this email.\n\nRegards,\nHotel Himalaya INN\`;
  const html = otpTemplate(otp, 'reset');
  return sendEmail(email, subject, text, html);
};

/**
 * Send password changed confirmation.
 */
const sendPasswordChangedEmail = async (email, name) => {
  const subject = "Password Changed Successfully — Hotel Himalaya INN";
  const text = \`Hello \${name},\n\nYour password has been changed successfully. If you did not make this change, please contact support.\n\nRegards,\nHotel Himalaya INN\`;
  const html = resetPasswordSuccessTemplate(name);
  return sendEmail(email, subject, text, html);
};

/**
 * Send welcome email upon successful verification.
 */
const sendWelcomeEmail = async (email, name) => {
  const subject = "Welcome to Hotel Himalaya INN";
  const text = \`Hello \${name},\n\nWelcome to Hotel Himalaya INN Khona! Your account has been successfully verified. You can now book luxury rooms, exclusive tours, and manage your reservations directly from your dashboard.\n\nRegards,\nHotel Himalaya INN\`;
  const html = welcomeTemplate(name);
  return sendEmail(email, subject, text, html);
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWelcomeEmail
};
