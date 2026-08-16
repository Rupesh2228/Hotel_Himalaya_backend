const cron = require('node-cron');
const Booking = require('../models/Booking');

/**
 * Helper to get today's date at midnight (00:00:00) in local time.
 */
const getMidnight = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Transition Confirmed bookings → Ongoing when check-in date arrives.
 * Transition Ongoing bookings → Completed when check-out date has passed.
 */
const runStatusTransitions = async () => {
  const today = getMidnight();
  let transitioned = 0;

  try {
    // Confirmed → Ongoing: check-in date is today or in the past
    const confirmedBookings = await Booking.find({
      status: 'Confirmed',
    }).select('_id bookingId checkIn checkOut status');

    for (const booking of confirmedBookings) {
      const checkInDate = parseDate(booking.checkIn);
      if (checkInDate && checkInDate <= today) {
        booking.status = 'Ongoing';
        await booking.save();
        console.log(`[CRON] Booking ${booking.bookingId} → Ongoing (check-in: ${booking.checkIn})`);
        transitioned++;
      }
    }

    // Ongoing → Completed: check-out date has passed
    const ongoingBookings = await Booking.find({
      status: 'Ongoing',
    }).select('_id bookingId checkIn checkOut status');

    for (const booking of ongoingBookings) {
      const checkOutDate = parseDate(booking.checkOut);
      if (checkOutDate && checkOutDate < today) {
        booking.status = 'Completed';
        await booking.save();
        console.log(`[CRON] Event Booking completed: ${booking.bookingId} (check-out: ${booking.checkOut})`);
        transitioned++;
      }
    }

    // Also transition Pending bookings that are past check-out to Completed
    // (safeguard for missed confirmations)
    const pendingOld = await Booking.find({
      status: 'Pending',
    }).select('_id bookingId checkOut status');

    for (const booking of pendingOld) {
      const checkOutDate = parseDate(booking.checkOut);
      if (checkOutDate && checkOutDate < today) {
        booking.status = 'Completed';
        await booking.save();
        console.log(`[CRON] Expired pending booking ${booking.bookingId} → Completed`);
        transitioned++;
      }
    }

    if (transitioned > 0) {
      console.log(`[CRON] Status transitions complete. ${transitioned} booking(s) updated.`);
    }
  } catch (err) {
    console.error('[CRON-ERROR] Error during status transitions:', err.message);
  }
};

/**
 * Initialize cron jobs. Call this from app.js after DB is connected.
 */
const initCronJobs = () => {
  // Run every day at 00:05 Asia/Kathmandu time
  cron.schedule('5 0 * * *', async () => {
    console.log('[CRON] Running daily booking status transitions...');
    await runStatusTransitions();
  }, {
    timezone: 'Asia/Kathmandu'
  });

  // Also run every hour to catch day boundaries
  cron.schedule('0 * * * *', async () => {
    await runStatusTransitions();
  }, {
    timezone: 'Asia/Kathmandu'
  });

  console.log('[CRON] Booking status cron jobs initialized (daily + hourly)');
};

module.exports = { initCronJobs, runStatusTransitions };
