const adminLoginNotificationTemplate = (adminName, email, loginDetails) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login Alert - Hotel Himalaya INN Khona</title>
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
      border-top: 6px solid #2563eb; 
    }
    .header { 
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 30px 20px;
      text-align: center;
      border-bottom: 3px solid #2563eb;
    }
    .header h1 { 
      color: #ffffff; 
      margin: 0; 
      font-size: 24px; 
      letter-spacing: 2px;
      font-weight: 700;
    }
    .header p { 
      color: #2563eb; 
      margin: 8px 0 0 0; 
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 1px;
    }
    .content { padding: 40px 30px; }
    .alert-box { 
      background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
      border-left: 5px solid #2563eb; 
      padding: 20px; 
      margin-bottom: 30px; 
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
    }
    .alert-box h2 { 
      margin: 0 0 8px 0; 
      font-size: 18px; 
      color: #1e40af;
      font-weight: 700;
    }
    .alert-box p { 
      margin: 0; 
      font-size: 14px; 
      color: #1e40af;
    }
    .info-section {
      background: linear-gradient(135deg, #f0fdf4 0%, #f1f5fe 100%);
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 25px;
      border-left: 4px solid #16a34a;
    }
    .info-section h3 {
      margin: 0 0 15px 0;
      font-size: 14px;
      color: #15803d;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(22, 163, 74, 0.1);
      font-size: 14px;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #15803d;
    }
    .info-value {
      color: #166534;
      word-break: break-word;
      text-align: right;
    }
    .admin-name {
      font-size: 18px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 5px;
    }
    .admin-email {
      font-size: 14px;
      color: #64748b;
    }
    .security-note {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      border-radius: 6px;
      margin-top: 25px;
      font-size: 13px;
      color: #78350f;
      line-height: 1.6;
    }
    .security-note strong {
      color: #92400e;
    }
    .button-container { 
      text-align: center; 
      margin: 35px 0 0 0;
    }
    .button { 
      display: inline-block; 
      padding: 14px 32px; 
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff !important; 
      text-decoration: none; 
      border-radius: 6px; 
      font-weight: 700; 
      font-size: 14px;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
    }
    .footer { 
      background: #f8f9fa; 
      padding: 20px; 
      text-align: center; 
      font-size: 12px; 
      color: #999999;
      border-top: 1px solid #eeeeee;
    }
    .status-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-left: 8px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>🔐 ADMIN ACCESS ALERT</h1>
        <p>Security Notification System</p>
      </div>
      
      <div class="content">
        <div class="alert-box">
          <h2>✅ Administrator Login Detected</h2>
          <p>An admin account has successfully logged into the system.</p>
        </div>

        <div class="info-section">
          <h3>👤 Admin Account</h3>
          <div class="admin-name">${adminName}</div>
          <div class="admin-email">${email} <span class="status-badge">Active</span></div>
        </div>

        <div class="info-section">
          <h3>🔍 Login Details</h3>
          ${Object.entries(loginDetails).map(([key, value]) => `
            <div class="info-row">
              <span class="info-label">${key}</span>
              <span class="info-value">${value}</span>
            </div>
          `).join('')}
        </div>

        <div class="security-note">
          <strong>🔒 Security Reminder:</strong> If you did not authorize this login or notice any suspicious activity, please change your password immediately and contact the system administrator.
        </div>

        <div class="button-container">
          <a href="${process.env.FRONTEND_URL || 'https://hotel-himalaya-frontend.vercel.app'}/hh-cp-9f3m2q" class="button">
            📊 GO TO ADMIN DASHBOARD
          </a>
        </div>
      </div>

      <div class="footer">
        <p>This is an automated security notification from Hotel Himalaya INN Khona.</p>
        <p style="margin-top: 8px; font-size: 11px;">If you did not initiate this login, please secure your account immediately.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

module.exports = adminLoginNotificationTemplate;
