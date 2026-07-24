const adminNotificationTemplate = (type, details) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Alert - Hotel Himalaya INN Khona</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 5px solid #d4af37; }
    .header { background-color: #1a1a2e; padding: 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px; }
    .content { padding: 30px; color: #333333; line-height: 1.6; }
    .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 25px; border-radius: 4px; }
    .alert-box h2 { margin: 0 0 5px 0; font-size: 18px; color: #856404; }
    .alert-box p { margin: 0; font-size: 14px; color: #856404; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .details-table th, .details-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eeeeee; }
    .details-table th { width: 35%; color: #666666; font-weight: 600; font-size: 14px; }
    .details-table td { font-weight: 500; font-size: 15px; }
    .button-container { text-align: center; margin: 30px 0 10px 0; }
    .button { display: inline-block; padding: 12px 24px; background-color: #1a1a2e; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; }
    .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ADMINISTRATION SYSTEM</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2>New Action Required: ${type}</h2>
        <p>A new activity has been recorded on the platform.</p>
      </div>
      
      <table class="details-table">
        <tbody>
          ${Object.entries(details).map(([key, value]) => `
            <tr>
              <th>${key}</th>
              <td>${value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="button-container">
        <a href="${process.env.FRONTEND_URL || 'https://hotel-himalaya-frontend.vercel.app'}/hh-cp-9f3m2q" class="button">Open Admin Dashboard</a>
      </div>
    </div>
    <div class="footer">
      This is an automated system notification from Hotel Himalaya INN Khona.
    </div>
  </div>
</body>
</html>
`;

module.exports = adminNotificationTemplate;
