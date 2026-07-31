const mongoose = require('mongoose');

const eventBookingSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  eventTitle: { type: String, required: true },
  eventPrice: { type: Number, default: 0 },
  ticketsCount: { type: Number, required: true, default: 1 },
  bookedBy: { type: String, default: 'guest' }, // User ID or 'guest'
  bookedByName: { type: String, default: 'Guest' },
  bookedByEmail: { type: String, default: '' },
  bookedByPhone: { type: String, default: '' },
  status: { type: String, default: 'Booked' },
  deviceId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('EventBooking', eventBookingSchema);
