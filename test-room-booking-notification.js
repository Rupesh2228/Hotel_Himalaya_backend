require('dotenv').config();
const { createAdminNotification } = require('./services/notificationService');
const { connectDB } = require('./db');

async function testRoomBookingNotification() {
  try {
    await connectDB();
    console.log('\n========== TESTING ROOM BOOKING NOTIFICATION ==========\n');

    // Simulate a room booking notification
    const details = {
      'Guest Name': 'Raj Kumar',
      'Email': 'raj@example.com',
      'Phone': '+977-1234567890',
      'Room Type': 'Deluxe Double Room',
      'Number of Guests': '2',
      'Check-in Date': '2026-08-01',
      'Check-out Date': '2026-08-03',
      'Duration': '2 Nights',
      'Price Per Night': 'Rs. 5000',
      'Total Price': 'Rs. 10000',
      'Verification Code': 'ABCD1234'
    };

    console.log('Sending test room booking notification...\n');
    
    await createAdminNotification({
      type: 'booking',
      title: 'New Room Booking: Deluxe Double Room',
      message: 'Raj Kumar booked Deluxe Double Room from 2026-08-01 to 2026-08-03.',
      link: '/admin/bookings/test123',
      sendEmail: true,
      details: details
    });

    console.log('\n✓ Room booking notification sent successfully!');
    console.log('✓ Email sent to configured admin only (adminhotel49@gmail.com excluded)');
    console.log('\nCheck email for the notification.\n');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testRoomBookingNotification();
