const Event = require('../models/Event');
const EventBooking = require('../models/EventBooking');
const { createAdminNotification } = require('../services/notificationService');

// Create Event (Admin only)
const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, price, location, availableSeats, totalSeats, imageUrl } = req.body;
    if (!title || !description || !date || !time || !location) {
      return res.status(400).json({ error: 'Missing required event fields' });
    }

    const event = await Event.create({
      title,
      description,
      date,
      time,
      price: (price !== undefined && price !== null && price !== '') ? Number(price) : 0,
      location,
      totalSeats: Number(totalSeats) || 50,
      availableSeats: (availableSeats !== undefined && availableSeats !== null && availableSeats !== '') ? Number(availableSeats) : (Number(totalSeats) || 50),
      imageUrl: imageUrl || ''
    });

    res.status(201).json(event);
  } catch (err) {
    console.error('createEvent error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Update Event (Admin only)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, price, location, availableSeats, totalSeats, imageUrl } = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.time = time || event.time;
    event.price = (price !== undefined && price !== null && price !== '') ? Number(price) : event.price;
    event.location = location || event.location;
    event.totalSeats = totalSeats !== undefined ? Number(totalSeats) : event.totalSeats;
    event.availableSeats = availableSeats !== undefined ? Number(availableSeats) : event.availableSeats;
    event.imageUrl = imageUrl !== undefined ? imageUrl : event.imageUrl;

    await event.save();
    res.json(event);
  } catch (err) {
    console.error('updateEvent error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete Event (Admin only)
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

// Get All Events (Public)
const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error('getEvents error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// Book Event (Public or User)
const bookEvent = async (req, res) => {
  try {
    const { eventId, ticketsCount, bookedByName, bookedByEmail, bookedByPhone } = req.body;
    if (!eventId || !ticketsCount) {
      return res.status(400).json({ error: 'Event ID and tickets count are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const ticketCountNum = Number(ticketsCount);
    if (ticketCountNum <= 0) return res.status(400).json({ error: 'Invalid tickets count' });

    if (event.availableSeats < ticketCountNum) {
      return res.status(400).json({ error: 'Not enough available seats' });
    }

    // Update available seats
    event.availableSeats -= ticketCountNum;
    await event.save();

    // Create booking
    const booking = await EventBooking.create({
      eventId: event._id,
      eventTitle: event.title,
      eventPrice: event.price,
      ticketsCount: ticketCountNum,
      bookedBy: req.user ? req.user._id : 'guest',
      bookedByName: bookedByName || (req.user ? req.user.name : 'Guest'),
      bookedByEmail: bookedByEmail || (req.user ? req.user.email : ''),
      bookedByPhone: bookedByPhone || ''
    });


    // Notify admin about the new event booking
    try {
      const totalTicketPrice = event.price * ticketCountNum;
      
      await createAdminNotification({
        type: 'event_booking',
        title: `New Event Booking: ${event.title}`,
        message: `${booking.bookedByName} booked ${booking.ticketsCount} ticket(s) for ${event.title}`,
        link: `/admin/events/bookings/${booking._id}`,
        sendEmail: true,
        details: {
          'Event Name': event.title,
          'Event Date': event.date || 'N/A',
          'Event Time': event.time || 'N/A',
          'Location': event.location || 'N/A',
          'Guest Name': booking.bookedByName,
          'Email': booking.bookedByEmail || 'N/A',
          'Phone': booking.bookedByPhone || 'N/A',
          'Available Seats': event.availableSeats,
          'Tickets Booked': booking.ticketsCount,
          'Price Per Ticket': `Rs. ${event.price}`,
          'Total Price': `Rs. ${totalTicketPrice}`
        }
      });
    } catch (e) {
      console.error('Failed to queue admin event booking notification:', e && e.message ? e.message : e);
    }
    res.status(201).json(booking);
  } catch (err) {
    console.error('bookEvent error:', err);
    res.status(500).json({ error: 'Failed to book event' });
  }
};

// Get User Bookings
const getUserBookings = async (req, res) => {
  try {
    const bookings = await EventBooking.find({ bookedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('getUserBookings error:', err);
    res.status(500).json({ error: 'Failed to fetch user bookings' });
  }
};

// Get All Event Bookings (Admin only)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await EventBooking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('getAllBookings error:', err);
    res.status(500).json({ error: 'Failed to fetch all bookings' });
  }
};

// Delete Event Booking (Admin only or user cancel)
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await EventBooking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Restore seats
    const event = await Event.findById(booking.eventId);
    if (event) {
      event.availableSeats += booking.ticketsCount;
      await event.save();
    }

    await EventBooking.findByIdAndDelete(id);
    res.json({ message: 'Booking deleted / cancelled successfully' });
  } catch (err) {
    console.error('deleteBooking error:', err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  bookEvent,
  getUserBookings,
  getAllBookings,
  deleteBooking,
};
