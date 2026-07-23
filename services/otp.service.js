const { sendEmail } = require("./emailService");

/**
 * Generate a cryptographically random 6-digit OTP.
 * Uses Math.random for speed — good enough for short-lived OTPs.
 * @returns {string} 6-digit string
 */
const generateOTP = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

/**
 * Build the professional HTML email body for OTP verification.
 * @param {string} name - User's first/full name
 * @param {string} otp  - 6-digit OTP code
 * @returns {string} HTML string
 */
const buildOTPEmailHTML = (name, otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#24463c 0%,#1a3329 100%);padding:40px 48px;text-align:center;">
              <h1 style="margin:0;color:#f6d194;font-size:24px;font-weight:700;letter-spacing:1px;">
                🏔️ Hotel Himalaya INN
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">
                Khona, Nepal
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              <h2 style="margin:0 0 12px;font-size:22px;color:#202623;font-weight:600;">
                Verify Your Email Address
              </h2>
              <p style="margin:0 0 28px;color:#5c6b65;font-size:15px;line-height:1.7;">
                Hello <strong>${name}</strong>,<br/>
                Thank you for registering with Hotel Himalaya INN. Use the verification code below to confirm your email address and complete your registration.
              </p>

              <!-- OTP Box -->
              <div style="background:#f0f9f5;border:2px dashed #24463c;border-radius:10px;padding:28px;text-align:center;margin:0 0 28px;">
                <p style="margin:0 0 8px;font-size:13px;color:#5c6b65;text-transform:uppercase;letter-spacing:2px;font-weight:600;">
                  Your Verification Code
                </p>
                <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#24463c;font-family:'Courier New',monospace;">
                  ${otp}
                </div>
                <p style="margin:12px 0 0;font-size:12px;color:#8a9e96;">
                  ⏱ This code expires in <strong>5 minutes</strong>
                </p>
              </div>

              <p style="margin:0 0 8px;color:#5c6b65;font-size:14px;line-height:1.7;">
                If you did not create an account with Hotel Himalaya INN, please ignore this email. Your account will not be activated without verification.
              </p>

              <!-- Security notice -->
              <div style="background:#fff8f0;border-left:4px solid #b87936;border-radius:4px;padding:14px 16px;margin:24px 0;">
                <p style="margin:0;color:#7a4f1e;font-size:13px;font-weight:600;">
                  🔒 Security Notice
                </p>
                <p style="margin:6px 0 0;color:#8a6540;font-size:13px;">
                  Never share this code with anyone. Hotel Himalaya INN staff will never ask for your OTP.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9faf9;padding:28px 48px;border-top:1px solid #e8ece9;">
              <p style="margin:0;color:#8a9e96;font-size:12px;text-align:center;line-height:1.7;">
                © ${new Date().getFullYear()} Hotel Himalaya INN · Khona, Nepal<br/>
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Build the professional HTML email body for password reset.
 * @param {string} name      - User's name
 * @param {string} resetUrl  - Full reset URL with token
 * @returns {string} HTML string
 */
const buildPasswordResetHTML = (name, resetUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Password Reset</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#24463c 0%,#1a3329 100%);padding:40px 48px;text-align:center;">
              <h1 style="margin:0;color:#f6d194;font-size:24px;font-weight:700;letter-spacing:1px;">
                🏔️ Hotel Himalaya INN
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">
                Khona, Nepal
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              <h2 style="margin:0 0 12px;font-size:22px;color:#202623;font-weight:600;">
                Reset Your Password
              </h2>
              <p style="margin:0 0 28px;color:#5c6b65;font-size:15px;line-height:1.7;">
                Hello <strong>${name}</strong>,<br/>
                We received a request to reset the password for your Hotel Himalaya INN account. Click the button below to set a new password.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:0 0 28px;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#24463c,#1a3329);color:#f6d194;text-decoration:none;padding:16px 36px;border-radius:999px;font-size:15px;font-weight:700;letter-spacing:0.5px;box-shadow:0 8px 24px rgba(36,70,60,0.3);">
                  Reset Password
                </a>
              </div>

              <p style="margin:0 0 8px;color:#5c6b65;font-size:13px;line-height:1.7;">
                Or copy and paste this link in your browser:<br/>
                <a href="${resetUrl}" style="color:#24463c;word-break:break-all;">${resetUrl}</a>
              </p>

              <!-- Security notice -->
              <div style="background:#fff8f0;border-left:4px solid #b87936;border-radius:4px;padding:14px 16px;margin:24px 0;">
                <p style="margin:0;color:#7a4f1e;font-size:13px;font-weight:600;">
                  ⏱ This link expires in 15 minutes
                </p>
                <p style="margin:6px 0 0;color:#8a6540;font-size:13px;">
                  If you did not request a password reset, please ignore this email. Your password will remain unchanged.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9faf9;padding:28px 48px;border-top:1px solid #e8ece9;">
              <p style="margin:0;color:#8a9e96;font-size:12px;text-align:center;line-height:1.7;">
                © ${new Date().getFullYear()} Hotel Himalaya INN · Khona, Nepal<br/>
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Send an OTP verification email to a newly registered user.
 * @param {string} email - Recipient email
 * @param {string} name  - User's name (used in greeting)
 * @param {string} otp   - 6-digit OTP
 * @returns {Promise<object|null>}
 */
const sendOTPEmail = async (email, name, otp) => {
  const subject = "Verify Your Email — Hotel Himalaya INN";
  const text = `Hello ${name},\n\nYour verification code is: ${otp}\n\nThis code expires in 5 minutes.\n\nDo not share this OTP with anyone.\n\nRegards,\nHotel Himalaya INN`;
  const html = buildOTPEmailHTML(name, otp);
  return sendEmail(email, subject, text, html);
};

/**
 * Send a password-reset link email.
 * @param {string} email    - Recipient email
 * @param {string} name     - User's name
 * @param {string} resetUrl - Full reset URL
 * @returns {Promise<object|null>}
 */
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const subject = "Password Reset Request — Hotel Himalaya INN";
  const text = `Hello ${name},\n\nReset your password using this link:\n${resetUrl}\n\nThis link expires in 15 minutes.\n\nIf you did not request this, ignore this email.\n\nRegards,\nHotel Himalaya INN`;
  const html = buildPasswordResetHTML(name, resetUrl);
  return sendEmail(email, subject, text, html);
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetEmail,
};
