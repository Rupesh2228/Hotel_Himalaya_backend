const bookingTemplate = (bookingDetails) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation - Hotel Himalaya INN Khona</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { background-color: #1a1a2e; padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }
    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
    .content p { margin: 0 0 20px 0; font-size: 16px; }
    .highlight { color: #d4af37; font-weight: bold; }
    .booking-details { background: #f8f9fa; border: 1px solid #eeeeee; border-radius: 6px; padding: 20px; margin-bottom: 30px; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #e0e0e0; padding-bottom: 8px; }
    .detail-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .detail-label { font-weight: 600; color: #555555; }
    .detail-value { text-align: right; color: #111111; font-weight: 500; }
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
      <p>Dear <span class="highlight">${bookingDetails.guestName}</span>,</p>
      <p>Thank you for choosing Hotel Himalaya INN Khona! We are delighted to confirm your room reservation.</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Booking ID</span>
          <span class="detail-value">${bookingDetails.bookingId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Room</span>
          <span class="detail-value">${bookingDetails.roomTitle}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Check-in</span>
          <span class="detail-value">${bookingDetails.checkIn}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Check-out</span>
          <span class="detail-value">${bookingDetails.checkOut}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Guests</span>
          <span class="detail-value">${bookingDetails.members}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Amount</span>
          <span class="detail-value">Rs. ${bookingDetails.price}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-value" style="color: #28a745;">Confirmed</span>
        </div>
        ${bookingDetails.verificationCode ? `
        <div class="detail-row">
          <span class="detail-label">Verification Code</span>
          <span class="detail-value highlight">${bookingDetails.verificationCode}</span>
        </div>` : ''}
      </div>
      
      <p>Please present your Booking ID and Verification Code upon arrival at the reception.</p>
      
      <div class="button-container">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">View Booking Status</a>
      </div>
      
      <p>If you have any questions or require modifications to your booking, please reply to this email or contact our support.</p>
      <p>We look forward to welcoming you.</p>
      <p>Warm regards,<br><strong>The Hotel Himalaya INN Khona Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Hotel Himalaya INN Khona. All rights reserved.</p>
      <p>Support Contact: +977-9800000000</p>
      <div class="social-links">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Website</a> | <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/contact">Contact Us</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

module.exports = bookingTemplate;
