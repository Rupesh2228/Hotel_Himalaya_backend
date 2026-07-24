require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');
const { connectDB } = require('./db');
const { sendEmail, sendAdminEmail } = require('./services/email.service');
const { createAdminNotification } = require('./services/notificationService');

async function runDiagnostics() {
  console.log('\n========== ADMIN EMAIL DIAGNOSTIC ==========\n');

  // 1. Check environment variables
  console.log('1. ENVIRONMENT VARIABLES CHECK:');
  const envVars = {
    'ADMIN_EMAIL': process.env.ADMIN_EMAIL,
    'GOOGLE_ADMIN_EMAIL': process.env.GOOGLE_ADMIN_EMAIL,
    'SMTP_EMAIL': process.env.SMTP_EMAIL,
    'SMTP_PASSWORD': process.env.SMTP_PASSWORD ? '***SET***' : '***NOT SET***',
    'SMTP_SERVICE': process.env.SMTP_SERVICE,
    'BREVO_API_KEY': process.env.BREVO_API_KEY ? '***SET***' : '***NOT SET***',
    'FRONTEND_URL': process.env.FRONTEND_URL,
  };
  
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  const adminEmail = (process.env.ADMIN_EMAIL || process.env.GOOGLE_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!adminEmail) {
    console.error('\n   ❌ ERROR: No ADMIN_EMAIL configured!');
    return;
  }
  console.log('   ✓ Admin email configured:', adminEmail);

  // 2. Connect to database
  console.log('\n2. DATABASE CONNECTION CHECK:');
  try {
    await connectDB();
    console.log('   ✓ Connected to MongoDB');
  } catch (err) {
    console.error('   ❌ Failed to connect to MongoDB:', err.message);
    return;
  }

  // 3. Check admin users in database
  console.log('\n3. DATABASE ADMIN USERS CHECK:');
  try {
    const allAdmins = await User.find({ role: 'admin' }).select('email name isVerified').lean();
    console.log(`   Found ${allAdmins.length} admin user(s) with role='admin'`);
    
    if (allAdmins.length > 0) {
      allAdmins.forEach(admin => {
        console.log(`   - ${admin.email} (verified: ${admin.isVerified})`);
      });
    }

    const verifiedAdmins = await User.find({ role: 'admin', isVerified: true }).select('email name').lean();
    console.log(`   Found ${verifiedAdmins.length} verified admin(s)`);
    
    if (verifiedAdmins.length === 0) {
      console.warn('   ⚠ WARNING: No verified admin users found in database!');
    }
  } catch (err) {
    console.error('   ❌ Error checking admin users:', err.message);
  }

  // 4. Test email sending
  console.log('\n4. EMAIL SENDING TEST:');
  try {
    console.log(`   Testing email send to: ${adminEmail}`);
    const result = await sendAdminEmail(
      'Test Email - Admin Notification System',
      'If you receive this email, the admin notification system is working correctly!',
      '<html><body><h2>Admin Notification Test</h2><p>If you receive this email, the admin notification system is working correctly!</p></body></html>'
    );
    
    if (result) {
      console.log('   ✓ Email sent successfully!');
      console.log('   Message ID:', result.messageId);
    } else {
      console.error('   ❌ Email sending returned null');
    }
  } catch (err) {
    console.error('   ❌ Error sending test email:', err.message);
  }

  // 5. Test notification creation
  console.log('\n5. ADMIN NOTIFICATION CREATION TEST:');
  try {
    await createAdminNotification({
      type: 'diagnostic_test',
      title: 'Admin Email System Diagnostic Test',
      message: 'This is a test notification to verify the admin email system is working.',
      link: '/admin/dashboard',
      sendEmail: true,
      details: {
        'Test Type': 'System Diagnostic',
        'Timestamp': new Date().toISOString(),
        'Environment': process.env.NODE_ENV || 'development'
      }
    });
    console.log('   ✓ Notification created (check email shortly)');
  } catch (err) {
    console.error('   ❌ Error creating notification:', err.message);
  }

  // 6. Check recent notifications
  console.log('\n6. RECENT NOTIFICATIONS IN DATABASE:');
  try {
    const recentNotifs = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    if (recentNotifs.length > 0) {
      console.log(`   Found ${recentNotifs.length} recent notification(s):`);
      recentNotifs.forEach(notif => {
        const date = new Date(notif.createdAt).toLocaleString();
        console.log(`   - [${date}] Type: ${notif.type}, Title: ${notif.title}`);
      });
    } else {
      console.log('   No notifications found in database');
    }
  } catch (err) {
    console.error('   ❌ Error checking notifications:', err.message);
  }

  console.log('\n========== DIAGNOSTIC COMPLETE ==========\n');
  process.exit(0);
}

runDiagnostics().catch(err => {
  console.error('Diagnostic failed:', err);
  process.exit(1);
});
