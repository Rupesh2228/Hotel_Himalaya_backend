require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const { connectDB } = require('./db');

async function checkBookings() {
  try {
    await connectDB();
    console.log('\n========== BOOKING AUDIT ==========\n');

    const allBookings = await Booking.find().sort({ createdAt: -1 });
    
    console.log(`Total bookings: ${allBookings.length}\n`);

    allBookings.forEach((booking, index) => {
      const date = new Date(booking.createdAt).toLocaleString();
      console.log(`${index + 1}. [${date}] ${booking.roomTitle}`);
      console.log(`   Booked by: ${booking.bookedByName} (${booking.bookedByEmail})`);
      console.log(`   Dates: ${booking.checkIn} → ${booking.checkOut}`);
      console.log(`   Status: ${booking.status} | Verified: ${booking.verified}`);
      console.log();
    });

    // Show which bookings are blocking new bookings
    console.log('\n========== ACTIVE BOOKINGS (Blocking New Bookings) ==========\n');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeBookings = allBookings.filter(b => {
      const checkOutDate = new Date(b.checkOut);
      checkOutDate.setHours(0, 0, 0, 0);
      return checkOutDate >= today && b.status !== 'Cancelled';
    });

    if (activeBookings.length === 0) {
      console.log('No active bookings found.');
    } else {
      activeBookings.forEach((booking, index) => {
        console.log(`${index + 1}. ${booking.roomTitle} - ${booking.checkIn} to ${booking.checkOut}`);
        console.log(`   By: ${booking.bookedByName}`);
      });
    }

    console.log('\n========== TO DELETE OLD/TEST BOOKINGS ==========\n');
    console.log('Run: node clear-bookings.js');
    console.log('This will delete all expired bookings.\n');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkBookings();
