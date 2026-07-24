# Admin Login Notification Feature

## Overview
Admins now receive email alerts when other admins log into the system. This security feature helps track unauthorized access and maintain system security.

## How It Works

### Trigger Points
- Email/password login: `/api/auth/login`
- Google OAuth login: `/api/auth/google`

### Notification Logic
1. **When an admin logs in**, the system:
   - Captures login details (IP, timestamp, user-agent, login method)
   - Notifies ALL OTHER admins (excludes the admin who just logged in)
   - Uses admin's name and email from the User record
   - Sends formatted HTML email with security details

2. **Notification Recipients**
   - All verified admin users from the database
   - Fallback to configured `ADMIN_EMAIL` if database query fails
   - The logging-in admin is automatically excluded

3. **Email Details Include**
   - Admin name and email
   - Login time (NPT timezone)
   - IP address
   - User agent (browser/device info)
   - Login method (Email & Password or Google OAuth)

## Email Template
- **File**: `backend/templates/adminLogin.template.js`
- **Design**: Professional blue gradient header with security warning
- **Sections**:
  - Admin account info (green)
  - Login details (green)
  - Security warning (yellow)
  - Dashboard link button
  - Security footer

## Code Implementation

### Files Modified
1. **backend/services/notificationService.js**
   - Added `notifyAdminLogin()` function
   - Filters recipients to exclude the logging-in admin
   - Sends emails via SMTP

2. **backend/controllers/authController.js**
   - Imported `notifyAdminLogin` from notificationService
   - Added notification calls in `login()` function
   - Added notification calls in `googleLogin()` function
   - Captures IP, user-agent, and timestamp from request

3. **backend/templates/adminLogin.template.js** (NEW)
   - Professional HTML email template
   - Security-focused design
   - Uses environment variables (FRONTEND_URL)

### Files Created
- `backend/test-admin-login-notification.js` - Basic test script
- `backend/test-admin-login-scenarios.js` - Comprehensive scenario tests
- `backend/ADMIN_LOGIN_NOTIFICATION.md` - This documentation

## Testing

### Basic Test
```bash
cd backend
node test-admin-login-notification.js
```
Expected output: Email sent to other admins

### Comprehensive Scenarios Test
```bash
cd backend
node test-admin-login-scenarios.js
```
Tests:
1. First admin login → notifies other admins
2. Second admin login → notifies other admins

## Error Handling
- Notifications are **fire-and-forget**
- Email failures are logged but don't block login
- Database query failures fall back to configured `ADMIN_EMAIL`
- All errors are caught and logged with `[ADMIN-LOGIN-NOTIFICATION]` prefix

## Security Considerations
1. **Excludes logging-in admin** from notification to prevent email spam
2. **Only verified admins** receive/trigger notifications
3. **Security warning** in email about unauthorized access
4. **IP and device info** helps detect suspicious logins
5. **No sensitive data** in email (no passwords or tokens)

## Environment Variables Required
- `SMTP_EMAIL` - Gmail address for sending
- `SMTP_PASSWORD` - 16-character Gmail App Password
- `ADMIN_EMAIL` - Fallback admin email
- `FRONTEND_URL` - For dashboard link button

## Troubleshooting

### Emails not sending
1. Check `SMTP_EMAIL` and `SMTP_PASSWORD` in `.env`
2. Run `node admin-email-diagnostic.js` to diagnose
3. Verify email configuration is correct

### Wrong recipients
1. Check User collection for verified admins
2. Run diagnostic to see which admins are found
3. Verify `role: 'admin'` and `isVerified: true` flags

### Notification showing in logs but not in email
1. Check SMTP connection via diagnostic
2. Verify recipient email is valid
3. Check Gmail spam folder

## Related Features
- Admin booking notifications - `backend/templates/adminNotification.template.js`
- Email notification service - `backend/services/notificationService.js`
- General admin notifications - `createAdminNotification()` function
