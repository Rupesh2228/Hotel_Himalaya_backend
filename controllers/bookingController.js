const crypto = require('crypto');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { createAdminNotification } = require('../services/notificationService');

const parseDate = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && value.includes('/')) {
    const parts = value.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        d.setHours(0,0,0,0);
        return d;
      } else if (parts[0].length === 4) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        d.setHours(0,0,0,0);
        return d;
      }
    }
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const hasOverlap = (existingBooking, checkIn, checkOut) => {
  const existingCheckIn = parseDate(existingBooking.checkIn);
  const existingCheckOut = parseDate(existingBooking.checkOut);
  const nextCheckIn = parseDate(checkIn);
  const nextCheckOut = parseDate(checkOut);

  if (!existingCheckIn || !existingCheckOut || !nextCheckIn || !nextCheckOut) {
    return false;
  }

  return existingCheckIn < nextCheckOut && nextCheckIn < existingCheckOut;
};

const getComputedStatus = (booking) => {
  const now = new Date();
  const checkIn = parseDate(booking.checkIn);
  const checkOut = parseDate(booking.checkOut);

  if (!checkIn || !checkOut) return 'Pending';
  if (booking.verified) return 'Verified';
  if (now > checkOut) return 'Completed';
  return 'Booked';
};

const generateVerificationCode = async () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = Array.from({ length: 6 }, () => letters[crypto.randomInt(0, letters.length)]).join('');
    const existing = await Booking.findOne({ verificationCode: code });
    if (!existing) return code;
  }

  throw new Error('Failed to generate a unique verification code');
};

const serializeBooking = (booking) => ({
  ...booking.toObject(),
  status: getComputedStatus(booking),
});

const findBookingByIdentifier = async (identifier) => {
  if (!identifier) return null;

  return Booking.findOne({
    $or: [{ _id: identifier }, { verificationCode: identifier }],
  });
};

const deleteExpiredBookings = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const allBookings = await Booking.find({});
  const expiredIds = allBookings
    .filter((booking) => {
      const checkOutDate = parseDate(booking.checkOut);
      return checkOutDate && checkOutDate < today;
    })
    .map((booking) => booking._id);

  if (expiredIds.length > 0) {
    await Booking.deleteMany({ _id: { $in: expiredIds } });
    console.log(`[CLEANUP] Deleted ${expiredIds.length} expired booking(s)`);
  }

  // Also delete unverified bookings older than 1 hour (prevent stale unverified bookings)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oldUnverifiedResult = await Booking.deleteMany({
    verified: false,
    createdAt: { $lt: oneHourAgo }
  });

  if (oldUnverifiedResult.deletedCount > 0) {
    console.log(`[CLEANUP] Deleted ${oldUnverifiedResult.deletedCount} old unverified booking(s)`);
  }
};

exports.getBookings = async (req, res) => {
  try {
    await deleteExpiredBookings();

    const { bookedBy, bookedByEmail } = req.query;
    const filter = bookedByEmail
      ? { bookedByEmail }
      : (bookedBy ? { bookedBy } : {});
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.json(bookings.map(serializeBooking));
  } catch (error) {
    console.error('getBookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

exports.createBooking = async (req, res) => {
  try {
    // Clean up expired/old unverified bookings first
    await deleteExpiredBookings();

    const { roomId, roomTitle, roomPrice, totalMembers, members, checkIn, checkOut, bookedBy, bookedByName, bookedByEmail, phone } = req.body;

    if (!roomId || !roomTitle || !checkIn || !checkOut || !members) {
      return res.status(400).json({ error: 'Room, members, check-in, and check-out are required' });
    }

    const checkInDate = parseDate(checkIn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!checkInDate || checkInDate < today) {
      return res.status(400).json({ error: 'Check-in date cannot be in the past' });
    }

    const checkOutDate = parseDate(checkOut);
    if (!checkOutDate || checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    // Only check VERIFIED bookings to avoid blocking on unconfirmed bookings
    // Unverified bookings older than 1 hour are auto-deleted by deleteExpiredBookings()
    const verifiedBookings = await Booking.find({ 
      roomId, 
      verified: true,
      status: { $ne: 'Cancelled' }
    });
    
    console.log(`[BOOKING-CHECK] Checking ${verifiedBookings.length} verified booking(s) for room ${roomTitle}`);
    
    const overlappingBooking = verifiedBookings.find((booking) => hasOverlap(booking, checkIn, checkOut));

    if (overlappingBooking) {
      console.log(`[BOOKING-CHECK] Found overlap with booking: ${overlappingBooking._id}`);
      return res.status(409).json({
        error: 'This room is already booked for the selected time',
        booking: serializeBooking(overlappingBooking),
      });
    }

    console.log(`[BOOKING-CHECK] No conflicts found - proceeding with booking`);

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Selected room not found' });
    }

    const days = Math.ceil(Math.abs(checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1;
    const computedPrice = room.price * days;

    const verificationCode = await generateVerificationCode();
    const booking = await Booking.create({
      roomId: room._id,
      roomTitle: room.title,
      roomPrice: computedPrice,
      totalMembers: room.totalMembers || 1,
      members: Number(members),
      checkIn,
      checkOut,
      verificationCode,
      bookedBy: bookedBy || 'guest',
      bookedByName: bookedByName || 'Guest',
      bookedByEmail: bookedByEmail || '',
      phone: phone || '',
    });

    console.log(`[BOOKING-CREATED] New booking: ${booking._id} for ${roomTitle}`);

    // Send admin notification (DB + Email)
    try {
      await createAdminNotification({
        type: 'booking',
        title: `New Room Booking: ${roomTitle}`,
        message: `${bookedByName || 'Guest'} booked ${roomTitle} from ${checkIn} to ${checkOut}.`,
        link: `/admin/bookings/${booking._id}`,
        sendEmail: true,
        details: {
          'Guest Name': bookedByName || 'Guest',
          'Email': bookedByEmail || 'N/A',
          'Phone': phone || 'N/A',
          'Room': roomTitle,
          'Check-in': checkIn,
          'Check-out': checkOut,
          'Total Price': `Rs. ${computedPrice}`,
          'Verification Code': verificationCode
        }
      });
    } catch (e) {
      console.error('Failed to queue admin booking notification:', e && e.message ? e.message : e);
    }

    res.status(201).json(serializeBooking(booking));
  } catch (error) {
    console.error('createBooking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

exports.verifyBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationCode, verifiedBy } = req.body;

    if (!verificationCode) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const booking = await findBookingByIdentifier(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.verificationCode !== verificationCode) {
      return res.status(400).json({ error: 'Verification code does not match' });
    }

    booking.verified = true;
    booking.verifiedAt = new Date();
    booking.verifiedBy = verifiedBy || 'admin';
    await booking.save();

    res.json(serializeBooking(booking));
  } catch (error) {
    console.error('verifyBooking error:', error);
    res.status(500).json({ error: 'Failed to verify booking' });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await findBookingByIdentifier(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await Booking.findByIdAndDelete(booking._id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('deleteBooking error:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};
