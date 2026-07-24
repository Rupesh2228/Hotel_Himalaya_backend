const welcomeTemplate = (name) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Hotel Himalaya INN Khona</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { background-color: #1a1a2e; padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }
    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
    .content p { margin: 0 0 20px 0; font-size: 16px; }
    .highlight { color: #d4af37; font-weight: bold; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; padding: 14px 32px; background-color: #d4af37; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 16px; }
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
      <p>Dear <span class="highlight">${name}</span>,</p>
      <p>Welcome to Hotel Himalaya INN Khona! Your account has been successfully verified, and we are thrilled to have you with us.</p>
      <p>As a registered member, you can now seamlessly book luxury rooms, exclusive tours, and manage your reservations directly from your dashboard.</p>
      
      <div class="button-container">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Go to Dashboard</a>
      </div>
      
      <p>If you have any questions or need assistance planning your stay, our dedicated support team is always here to help.</p>
      <p>Warm regards,<br><strong>The Hotel Himalaya INN Khona Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Hotel Himalaya INN Khona. All rights reserved.</p>
      <div class="social-links">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Website</a> | <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/contact">Contact Us</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

module.exports = welcomeTemplate;
