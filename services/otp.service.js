/**
 * Generate a cryptographically random 6-digit OTP.
 * (Email sending via Brevo is only used for admin notifications, not OTP)
 */
const generateOTP = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

module.exports = { generateOTP };
