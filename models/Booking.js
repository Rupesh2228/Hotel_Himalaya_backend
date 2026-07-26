const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  roomTitle: { type: String, required: true },
  roomPrice: { type: Number, default: 0 },
  totalMembers: { type: Number, default: 1 },
  members: { type: Number, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  verificationCode: { type: String, required: true, unique: true, index: true },
  bookedBy: { type: String, default: 'guest' },
  bookedByName: { type: String, default: 'Guest' },
  bookedByEmail: { type: String, default: '', index: true },
  phone: { type: String, default: '' },
  verified: { type: Boolean, default: false, index: true },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: String, default: '' },
  status: { type: String, default: 'Booked' },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Compound index for efficient booking lookups
bookingSchema.index({ roomId: 1, verified: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);