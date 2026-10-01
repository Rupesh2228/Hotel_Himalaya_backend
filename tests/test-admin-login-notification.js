require('dotenv').config();
const { notifyAdminLogin } = require('../services/notificationService');
const { connectDB } = require('../db');

async function testAdminLoginNotification() {
  try {
    await connectDB();
    console.log('\n========== TESTING ADMIN LOGIN NOTIFICATION ==========\n');

    // Simulate admin login
    const loginDetails = {
      'Login Time': new Date().toLocaleString('en-NP', { timeZone: 'Asia/Kathmandu' }),
      'IP Address': '192.168.1.100',
      'User Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Login Method': 'Email & Password'
    };

    console.log('Sending test admin login notification...\n');
    
    await notifyAdminLogin({
      adminName: 'Test Admin',
      adminEmail: 'maharjan2228rupesh@gmail.com',
      loginDetails
    });

    console.log('\n✓ Admin login notification sent successfully!');
    console.log('\nCheck email for the notification.\n');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testAdminLoginNotification();
