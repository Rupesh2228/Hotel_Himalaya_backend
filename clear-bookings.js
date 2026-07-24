require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const { connectDB } = require('./db');

async function clearBookings() {
  try {
    await connectDB();
    console.log('\n========== CLEARING BOOKINGS ==========\n');

    // Option 1: Clear ALL bookings (for fresh start)
    console.log('Choose action:');
    console.log('1. Delete ALL bookings (fresh start)');
    console.log('2. Delete only UNVERIFIED bookings');
    console.log('3. Delete bookings older than 24 hours\n');

    // For automated use, delete unverified bookings
    const unverifiedCount = await Booking.countDocuments({ verified: false });
    console.log(`Found ${unverifiedCount} unverified booking(s)\n`);

    if (unverifiedCount > 0) {
      const result = await Booking.deleteMany({ verified: false });
      console.log(`✓ Deleted ${result.deletedCount} unverified bookings\n`);
    }

    // Also delete expired bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredResult = await Booking.deleteMany({
      checkOut: { $lt: today.toISOString().split('T')[0] }
    });
    
    if (expiredResult.deletedCount > 0) {
      console.log(`✓ Deleted ${expiredResult.deletedCount} expired bookings\n`);
    }

    const remaining = await Booking.countDocuments();
    console.log(`Remaining bookings: ${remaining}\n`);

    console.log('========== DONE ==========\n');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

clearBookings();
