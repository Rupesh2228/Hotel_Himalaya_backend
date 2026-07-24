const adminNotificationTemplate = (type, details) => {
  // Separate details into categories for better organization
  const contactInfo = {};
  const bookingInfo = {};
  const otherInfo = {};

  // Categorize details
  Object.entries(details).forEach(([key, value]) => {
    if (['Name', 'Guest Name', 'Guest', 'Email', 'Phone'].includes(key)) {
      contactInfo[key] = value;
    } else if (['Message'].includes(key)) {
      otherInfo[key] = value;
    } else {
      bookingInfo[key] = value;
    }
  });

  const renderSection = (title, data) => {
    const entries = Object.entries(data);
    if (entries.length === 0) return '';
    
    return `
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1a1a2e; border-bottom: 2px solid #d4af37; padding-bottom: 8px;">${title}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${entries.map(([key, value]) => `
              <tr>
                <td style="padding: 10px; width: 40%; font-weight: 600; color: #555555; font-size: 14px; background: #f9f9f9; border-right: 1px solid #eeeeee;">${key}</td>
                <td style="padding: 10px; width: 60%; color: #333333; font-size: 14px; word-break: break-word;">${value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Alert - Hotel Himalaya INN Khona</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      color: #333333;
      line-height: 1.6;
    }
    .wrapper { max-width: 700px; margin: 30px auto; }
    .container { 
      background: #ffffff; 
      border-radius: 8px; 
      overflow: hidden; 
      box-shadow: 0 8px 24px rgba(0,0,0,0.12); 
      border-top: 6px solid #d4af37; 
    }
    .header { 
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 30px 20px;
      text-align: center;
      border-bottom: 3px solid #d4af37;
    }
    .header h1 { 
      color: #ffffff; 
      margin: 0; 
      font-size: 24px; 
      letter-spacing: 2px;
      font-weight: 700;
    }
    .header p { 
      color: #d4af37; 
      margin: 8px 0 0 0; 
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 1px;
    }
    .content { padding: 40px 30px; }
    .alert-box { 
      background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
      border-left: 5px solid #ffc107; 
      padding: 20px; 
      margin-bottom: 30px; 
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(255, 193, 7, 0.15);
    }
    .alert-box h2 { 
      margin: 0 0 8px 0; 
      font-size: 18px; 
      color: #856404;
      font-weight: 700;
    }
    .alert-box p { 
      margin: 0; 
      font-size: 14px; 
      color: #856404;
    }
    .section-title {
      margin: 25px 0 15px 0;
      font-size: 16px;
      color: #1a1a2e;
      border-bottom: 2px solid #d4af37;
      padding-bottom: 8px;
      font-weight: 700;
    }
    .detail-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #eeeeee;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      width: 40%;
      font-weight: 600;
      color: #555555;
      font-size: 13px;
      background: #f9f9f9;
      padding: 12px;
      border-right: 1px solid #eeeeee;
    }
    .detail-value {
      width: 60%;
      color: #333333;
      font-size: 14px;
      padding: 12px;
      word-break: break-word;
    }
    .contact-section {
      background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 25px;
      border-left: 4px solid #4caf50;
    }
    .contact-section .contact-item {
      margin-bottom: 12px;
    }
    .contact-section .contact-item:last-child {
      margin-bottom: 0;
    }
    .contact-item-label {
      font-weight: 700;
      color: #2e7d32;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .contact-item-value {
      color: #1b5e20;
      font-size: 16px;
      font-weight: 600;
      margin-top: 4px;
    }
    .button-container { 
      text-align: center; 
      margin: 35px 0 0 0;
    }
    .button { 
      display: inline-block; 
      padding: 14px 32px; 
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #ffffff !important; 
      text-decoration: none; 
      border-radius: 6px; 
      font-weight: 700; 
      font-size: 14px;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(26, 26, 46, 0.25);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(26, 26, 46, 0.35);
    }
    .footer { 
      background: #f8f9fa; 
      padding: 20px; 
      text-align: center; 
      font-size: 12px; 
      color: #999999;
      border-top: 1px solid #eeeeee;
    }
    .urgency-badge {
      display: inline-block;
      background: #ff6b6b;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      margin-left: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>🏨 HOTEL HIMALAYA INN</h1>
        <p>Administration Alert System</p>
      </div>
      
      <div class="content">
        <div class="alert-box">
          <h2>⚠️ New ${type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Alert <span class="urgency-badge">Action Required</span></h2>
          <p>A new booking or inquiry has been received and requires your attention.</p>
        </div>

        ${Object.keys(contactInfo).length > 0 ? `
          <div class="contact-section">
            <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #2e7d32; text-transform: uppercase; letter-spacing: 1px;">👤 GUEST/USER INFORMATION</h3>
            ${Object.entries(contactInfo).map(([key, value]) => `
              <div class="contact-item">
                <div class="contact-item-label">${key}</div>
                <div class="contact-item-value">${value}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${Object.keys(bookingInfo).length > 0 ? `
          <div>
            <h3 class="section-title">📋 BOOKING DETAILS</h3>
            <div style="overflow-x: auto;">
              ${Object.entries(bookingInfo).map(([key, value]) => `
                <div class="detail-row">
                  <div class="detail-label">${key}</div>
                  <div class="detail-value"><strong>${value}</strong></div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${Object.keys(otherInfo).length > 0 ? `
          <div style="margin-top: 25px;">
            <h3 class="section-title">💬 MESSAGE</h3>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; border-left: 4px solid #2196f3; word-break: break-word; line-height: 1.8; color: #333333;">
              ${otherInfo['Message'] || ''}
            </div>
          </div>
        ` : ''}

        <div class="button-container">
          <a href="${process.env.FRONTEND_URL || 'https://hotel-himalaya-frontend.vercel.app'}/hh-cp-9f3m2q" class="button">
            📊 OPEN ADMIN DASHBOARD
          </a>
        </div>
      </div>

      <div class="footer">
        <p>This is an automated system notification from Hotel Himalaya INN Khona.</p>
        <p style="margin-top: 8px; font-size: 11px;">Generated on ${new Date().toLocaleString('en-NP', { timeZone: 'Asia/Kathmandu' })} (NPT)</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = adminNotificationTemplate;
