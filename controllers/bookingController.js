const crypto = require('crypto');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { createAdminNotification } = require('../services/notificationService');
const { sendEmail, sendAdminEmail } = require('../services/email.service');
const bookingTemplate = require('../templates/booking.template');
const adminNotificationTemplate = require('../templates/adminNotification.template');

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

const generateBookingId = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const num = Math.floor(10000 + Math.random() * 90000);
    const code = `BK-${num}`;
    const existing = await Booking.findOne({ bookingId: code });
    if (!existing) return code;
  }
  throw new Error('Failed to generate a unique booking ID');
};

const serializeBooking = (booking) => {
  return typeof booking.toObject === 'function' ? booking.toObject() : booking;
};

exports.getBookings = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, parseInt(req.query.limit) || 100);
    const skip = (page - 1) * limit;
    
    const { status, date, search, bookedByEmail, bookedBy, email, guestEmail, deviceId } = req.query;
    const filter = {};

    const targetEmail = (bookedByEmail || guestEmail || email || '').trim();
    const targetOwner = (bookedBy || deviceId || '').trim();

    if (targetEmail && targetOwner) {
      filter.$or = [
        { guestEmail: { $regex: new RegExp(`^${targetEmail}$`, 'i') } },
        { bookedByEmail: { $regex: new RegExp(`^${targetEmail}$`, 'i') } },
        { bookedBy: targetOwner }
      ];
    } else if (targetEmail) {
      filter.$or = [
        { guestEmail: { $regex: new RegExp(`^${targetEmail}$`, 'i') } },
        { bookedByEmail: { $regex: new RegExp(`^${targetEmail}$`, 'i') } }
      ];
    } else if (targetOwner) {
      filter.bookedBy = targetOwner;
    }

    if (status) {
      filter.status = status;
    }

    if (date) {
      filter.checkIn = date;
    }

    if (search) {
      const searchCondition = [
        { guestName: { $regex: search, $options: 'i' } },
        { guestEmail: { $regex: search, $options: 'i' } },
        { bookingId: { $regex: search, $options: 'i' } }
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCondition }];
        delete filter.$or;
      } else {
        filter.$or = searchCondition;
      }
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter).skip(skip).limit(limit).lean().sort({ createdAt: -1 }),
      Booking.countDocuments(filter)
    ]);

    res.json({
      data: bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('getBookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(serializeBooking(booking));
  } catch (error) {
    console.error('getBookingById error:', error);
    res.status(500).json({ error: 'Failed to retrieve booking' });
  }
};

exports.createBooking = async (req, res) => {
  try {
    // Support both new field names and legacy field names
    const roomId = req.body.roomId;
    const guestName = req.body.guestName || req.body.bookedByName;
    const guestEmail = (req.body.guestEmail || req.body.bookedByEmail || '').toLowerCase().trim();
    const phone = req.body.phone;
    const checkIn = req.body.checkIn;
    const checkOut = req.body.checkOut;
    const guests = req.body.guests || req.body.members;
    const specialRequest = req.body.specialRequest || '';
    const address = req.body.address || 'Guest Stay';
    const bookedBy = req.body.bookedBy || req.body.deviceId || (req.user ? req.user._id : 'guest');

    if (!roomId || !guestName || !guestEmail || !phone || !checkIn || !checkOut || !guests) {
      return res.status(400).json({ error: 'Required fields: roomId, guestName, guestEmail, phone, checkIn, checkOut, guests' });
    }

    // Date validations
    const checkInDate = parseDate(checkIn);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    if (!checkInDate || checkInDate < yesterday) {
      return res.status(400).json({ error: 'Check-in date cannot be in the past' });
    }

    const checkOutDate = parseDate(checkOut);
    if (!checkOutDate || checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    // Room validation
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Selected room not found' });
    }

    if (!room.isAvailable) {
      return res.status(400).json({ error: 'Selected room is currently marked as unavailable' });
    }

    if (Number(guests) > Number(room.totalMembers || 2)) {
      return res.status(400).json({ error: `Selected room allows only ${room.totalMembers || 2} guests max` });
    }

    // Prevent double booking (overlapping dates, ignoring cancelled bookings)
    const existingBookings = await Booking.find({
      roomId,
      status: { $ne: 'Cancelled' }
    }).select('checkIn checkOut _id status').lean();

    const overlappingBooking = existingBookings.find((booking) => hasOverlap(booking, checkIn, checkOut));
    if (overlappingBooking) {
      return res.status(409).json({
        error: 'This room is already booked for the selected dates. Please choose different dates.'
      });
    }

    // Backend price calculation
    const nights = Math.ceil(Math.abs(checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1;
    const computedPrice = room.price * nights;

    const bookingId = await generateBookingId();
    const verificationCode = bookingId.split('-')[1]; // use portion as code for backward compatibility

    const booking = await Booking.create({
      bookingId,
      guestName,
      guestEmail,
      phone,
      roomId: room._id,
      roomName: room.title,
      checkIn,
      checkOut,
      guests: Number(guests),
      specialRequest: specialRequest || '',
      totalPrice: computedPrice,
      status: 'Pending',

      // Backward compatibility fields
      roomTitle: room.title,
      roomPrice: computedPrice,
      totalMembers: room.totalMembers || 2,
      members: Number(guests),
      verificationCode,
      bookedBy,
      bookedByName: guestName,
      bookedByEmail: guestEmail,
      address: address || 'Guest Stay',
      verified: false
    });

    console.log(`[BOOKING-CREATED] Unique booking saved: ${bookingId}`);

    // Respond immediately to the client so UI updates instantly
    res.status(201).json(serializeBooking(booking));

    // Process Notifications + Emails asynchronously in the background
    (async () => {
      // 1. Create Persistent Notification + Socket.IO + Web Push
      try {
        await createAdminNotification({
          type: 'BOOKING',
          title: 'New Room Booking',
          message: `${guestName} booked ${room.title}.`,
          link: `/hh-cp-9f3m2q`,
          bookingId: booking.bookingId
        });
      } catch (notifErr) {
        console.error('[BOOKING-ERROR] Failed to process notifications:', notifErr.message);
      }

      // 2. Nodemailer email alert to Guest
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Booking Received</h2>
            <p>Thank you for booking with our hotel.</p>
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Room:</strong> ${room.title}</p>
            <p><strong>Check-in:</strong> ${checkIn}</p>
            <p><strong>Check-out:</strong> ${checkOut}</p>
            <p><strong>Guests:</strong> ${guests}</p>
            <p><strong>Status:</strong> Pending</p>
          </div>
        `;
        await sendEmail(guestEmail, 'Booking Received', `Booking ID: ${bookingId} status is Pending`, emailHtml);
      } catch (guestEmailErr) {
        console.error('[EMAIL-ERROR] Guest booking email failed:', guestEmailErr.message);
      }

      // 3. Nodemailer email alert to Admin
      try {
        const details = {
          'Booking ID': bookingId,
          'Guest Name': guestName,
          'Email': guestEmail,
          'Phone': phone,
          'Room': room.title,
          'Check-in': checkIn,
          'Check-out': checkOut,
          'Guests': guests,
          'Total Price': `NPR ${computedPrice}`,
          'Status': 'Pending'
        };
        const adminHtml = adminNotificationTemplate('booking', details);
        await sendAdminEmail(`🔔 New Room Booking - Booking #${bookingId}`, `New room booking received for ${room.title}.`, adminHtml);
      } catch (adminEmailErr) {
        console.error('[EMAIL-ERROR] Admin booking email failed:', adminEmailErr.message);
      }
    })().catch((bgErr) => console.error('[BOOKING-BG-ERROR]', bgErr.message));
  } catch (error) {
    console.error('createBooking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of ${validStatuses.join(', ')}` });
    }

    const booking = await Booking.findOne({ $or: [{ _id: id }, { bookingId: id }] });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify transitions logic
    const current = booking.status;
    if (current === status) {
      return res.json(serializeBooking(booking));
    }

    // Restrict invalid status transitions:
    // Completed or Cancelled bookings cannot change status
    if (['Completed', 'Cancelled'].includes(current)) {
      return res.status(400).json({ error: `Cannot change status of a ${current} booking.` });
    }

    // Normal flow: Pending -> Confirmed -> Ongoing -> Completed.
    if (status === 'Ongoing' && current !== 'Confirmed' && current !== 'Pending') {
      return res.status(400).json({ error: 'Bookings must be Confirmed or Pending before starting check-in.' });
    }

    if (status === 'Completed' && current !== 'Ongoing') {
      return res.status(400).json({ error: 'Bookings must be Ongoing before they can be marked Completed.' });
    }

    booking.status = status;
    if (status === 'Confirmed') {
      booking.verified = true;
      booking.verifiedAt = new Date();
      booking.verifiedBy = req.user?.name || 'admin';
    }
    await booking.save();

    console.log(`[BOOKING-STATUS] Booking ${booking.bookingId} updated to ${status}`);

    // Send emails on material updates (Confirmed / Cancelled)
    if (status === 'Confirmed') {
      try {
        const details = {
          guestName: booking.guestName,
          bookingId: booking.bookingId,
          roomTitle: booking.roomName || booking.roomTitle || 'Room',
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          members: booking.guests || booking.members || booking.totalMembers || 1,
          price: booking.totalPrice || booking.roomPrice || 0,
          verificationCode: booking.verificationCode || ''
        };
        const confirmHtml = bookingTemplate(details);

        // 1. Deliver confirmation to Guest
        await sendEmail(
          booking.guestEmail,
          `✅ Booking Confirmed - #${booking.bookingId} | Hotel Himalaya INN`,
          `Your booking ${booking.bookingId} has been confirmed.`,
          confirmHtml
        );

        // 2. Deliver confirmation copy to logged-in admin & designated admin emails
        const adminDetails = {
          'Booking ID': booking.bookingId,
          'Guest Name': booking.guestName,
          'Email': booking.guestEmail,
          'Phone': booking.phone || 'N/A',
          'Room': booking.roomName || booking.roomTitle || 'Room',
          'Check-in': booking.checkIn,
          'Check-out': booking.checkOut,
          'Total Amount': `NPR ${booking.totalPrice || booking.roomPrice || 0}`,
          'Confirmed By': req.user?.name ? `${req.user.name} (${req.user.email})` : (booking.verifiedBy || 'Admin'),
          'Status': 'Confirmed'
        };
        const adminConfirmHtml = adminNotificationTemplate('booking', adminDetails);

        // Send to currently logged-in admin directly if available
        if (req.user?.email && req.user.email.toLowerCase() !== (booking.guestEmail || '').toLowerCase()) {
          await sendEmail(
            req.user.email,
            `📋 [Admin Copy] Booking #${booking.bookingId} Confirmed`,
            `Booking #${booking.bookingId} for ${booking.guestName} was confirmed.`,
            adminConfirmHtml
          );
        }

        // Send to all administrators
        await sendAdminEmail(
          `✅ Booking #${booking.bookingId} Confirmed`,
          `Booking #${booking.bookingId} for ${booking.guestName} was confirmed by ${req.user?.name || 'Admin'}.`,
          adminConfirmHtml,
          req.user?.email
        );
      } catch (e) {
        console.error('[EMAIL-ERROR] Confirm email delivery failed:', e.message);
      }
    } else if (status === 'Cancelled') {
      try {
        const cancelHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 24px;">
            <h2 style="color: #dc2626; margin-top: 0;">Booking Cancelled</h2>
            <p>Dear <strong>${booking.guestName}</strong>,</p>
            <p>Your reservation <strong>${booking.bookingId}</strong> has been cancelled.</p>
            <p><strong>Room:</strong> ${booking.roomName || booking.roomTitle}</p>
            <p><strong>Check-in:</strong> ${booking.checkIn}</p>
            <p><strong>Check-out:</strong> ${booking.checkOut}</p>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">If you believe this cancellation was made in error or have questions, please contact our support.</p>
            <p>— Hotel Himalaya INN Team</p>
          </div>
        `;

        // 1. Deliver cancellation to Guest
        await sendEmail(
          booking.guestEmail,
          `⚠️ Booking Cancelled - #${booking.bookingId} | Hotel Himalaya INN`,
          `Booking ${booking.bookingId} has been cancelled.`,
          cancelHtml
        );

        // 2. Deliver cancellation alert to logged-in admin & administrators
        const adminCancelDetails = {
          'Booking ID': booking.bookingId,
          'Guest Name': booking.guestName,
          'Email': booking.guestEmail,
          'Room': booking.roomName || booking.roomTitle || 'Room',
          'Check-in': booking.checkIn,
          'Check-out': booking.checkOut,
          'Cancelled By': req.user?.name ? `${req.user.name} (${req.user.email})` : 'Admin',
          'Status': 'Cancelled'
        };
        const adminCancelHtml = adminNotificationTemplate('booking', adminCancelDetails);

        if (req.user?.email && req.user.email.toLowerCase() !== (booking.guestEmail || '').toLowerCase()) {
          await sendEmail(
            req.user.email,
            `⚠️ [Admin Copy] Booking #${booking.bookingId} Cancelled`,
            `Booking #${booking.bookingId} for ${booking.guestName} was cancelled.`,
            adminCancelHtml
          );
        }

        await sendAdminEmail(
          `⚠️ Booking #${booking.bookingId} Cancelled`,
          `Booking #${booking.bookingId} was cancelled by ${req.user?.name || 'Admin'}.`,
          adminCancelHtml,
          req.user?.email
        );
      } catch (e) {
        console.error('[EMAIL-ERROR] Cancel email delivery failed:', e.message);
      }
    }

    res.json(serializeBooking(booking));
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
};

// Kept verifyBooking for old frontend buttons trigger
exports.verifyBooking = async (req, res) => {
  req.body.status = 'Confirmed';
  return exports.updateBookingStatus(req, res);
};

exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({ $or: [{ _id: id }, { bookingId: id }] });
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
