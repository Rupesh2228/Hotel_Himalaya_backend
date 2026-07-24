const otpTemplate = (otp, type = 'verification') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification - Hotel Himalaya INN Khona</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { background-color: #1a1a2e; padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }
    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
    .content p { margin: 0 0 20px 0; font-size: 16px; }
    .otp-box { text-align: center; margin: 30px 0; }
    .otp-code { display: inline-block; padding: 15px 30px; background-color: #f8f9fa; border: 2px dashed #d4af37; border-radius: 6px; font-size: 32px; font-weight: 700; color: #1a1a2e; letter-spacing: 4px; }
    .warning { font-size: 14px; color: #666666; background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; margin-top: 30px; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee; }
    .footer p { margin: 0 0 10px 0; font-size: 14px; color: #777777; }
    .social-links a { color: #d4af37; text-decoration: none; margin: 0 10px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>HOTEL HIMALAYA INN KHONA</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Thank you for choosing Hotel Himalaya INN Khona. Please use the following One-Time Password (OTP) to ${type === 'reset' ? 'reset your password' : 'verify your email address'}.</p>
      
      <div class="otp-box">
        <span class="otp-code">${otp}</span>
      </div>
      
      <p>This code will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
      
      <div class="warning">
        <strong>Security Notice:</strong> Never share your OTP with anyone. Our staff will never ask for your password or OTP.
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Hotel Himalaya INN Khona. All rights reserved.</p>
      <div class="social-links">
        <a href="#">Website</a> | <a href="#">Contact Us</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

module.exports = otpTemplate;
