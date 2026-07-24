const eventTemplate = (eventDetails) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Ticket Confirmation - Hotel Himalaya INN Khona</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { background-color: #1a1a2e; padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }
    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
    .content p { margin: 0 0 20px 0; font-size: 16px; }
    .highlight { color: #d4af37; font-weight: bold; }
    .booking-details { background: #f8f9fa; border: 1px solid #eeeeee; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #e0e0e0; padding-bottom: 8px; }
    .detail-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .detail-label { font-weight: 600; color: #555555; }
    .detail-value { text-align: right; color: #111111; font-weight: 500; }
    .qr-container { text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 6px; border: 1px solid #eeeeee; }
    .qr-placeholder { display: inline-block; width: 150px; height: 150px; background: #ffffff; border: 2px solid #333333; line-height: 150px; color: #333333; font-weight: bold; font-size: 14px; }
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
      <p>Dear <span class="highlight">${eventDetails.customerName}</span>,</p>
      <p>Your tickets for the upcoming event have been confirmed!</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Booking ID</span>
          <span class="detail-value">${eventDetails.bookingId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Event</span>
          <span class="detail-value">${eventDetails.eventName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-value">${eventDetails.eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time</span>
          <span class="detail-value">${eventDetails.eventTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Venue</span>
          <span class="detail-value">${eventDetails.venue || 'Hotel Himalaya INN Khona'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tickets</span>
          <span class="detail-value">${eventDetails.tickets}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-value" style="color: #28a745;">Confirmed</span>
        </div>
      </div>
      
      <div class="qr-container">
        <p style="margin-top: 0; margin-bottom: 15px; font-weight: 600;">Your E-Ticket QR Code</p>
        <div class="qr-placeholder">
          [ QR CODE HERE ]
        </div>
        <p style="margin-top: 15px; margin-bottom: 0; font-size: 12px; color: #777;">Please present this code at the venue entrance.</p>
      </div>
      
      <p>We look forward to seeing you at the event!</p>
      <p>Warm regards,<br><strong>The Hotel Himalaya INN Khona Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Hotel Himalaya INN Khona. All rights reserved.</p>
      <p>Support Contact: +977-9800000000</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = eventTemplate;
