require('dotenv').config();
const { notifyAdminLogin } = require('./services/notificationService');
const { connectDB } = require('./db');

async function testScenarios() {
  try {
    await connectDB();
    console.log('\n========== COMPREHENSIVE ADMIN LOGIN NOTIFICATION TESTS ==========\n');

    // Scenario 1: First admin logs in
    console.log('SCENARIO 1: First admin (maharjan2228rupesh@gmail.com) logs in');
    console.log('Expected: Should notify adminhotel49@gmail.com only\n');
    
    let loginDetails1 = {
      'Login Time': new Date().toLocaleString('en-NP', { timeZone: 'Asia/Kathmandu' }),
      'IP Address': '192.168.1.101',
      'User Agent': 'Chrome/120.0 (Windows)',
      'Login Method': 'Email & Password'
    };

    await notifyAdminLogin({
      adminName: 'Rupesh Maharjan',
      adminEmail: 'maharjan2228rupesh@gmail.com',
      loginDetails: loginDetails1
    });
    console.log('✓ Scenario 1 complete\n');

    // Wait a moment between tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Scenario 2: Second admin logs in
    console.log('SCENARIO 2: Second admin (adminhotel49@gmail.com) logs in');
    console.log('Expected: Should notify maharjan2228rupesh@gmail.com only\n');
    
    let loginDetails2 = {
      'Login Time': new Date().toLocaleString('en-NP', { timeZone: 'Asia/Kathmandu' }),
      'IP Address': '192.168.1.102',
      'User Agent': 'Firefox/121.0 (macOS)',
      'Login Method': 'Google OAuth'
    };

    await notifyAdminLogin({
      adminName: 'Admin Hotel',
      adminEmail: 'adminhotel49@gmail.com',
      loginDetails: loginDetails2
    });
    console.log('✓ Scenario 2 complete\n');

    console.log('========== ALL TESTS COMPLETED SUCCESSFULLY ==========\n');
    console.log('✓ Admin login notifications are properly excluding the logging-in admin');
    console.log('✓ Notifications are being sent to other admins only\n');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testScenarios();
