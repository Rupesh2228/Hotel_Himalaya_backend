const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true, index: true },
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  roomName: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  guests: { type: Number, required: true },
  specialRequest: { type: String, default: '' },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  // Legacy / existing compatibility fields
  roomTitle: { type: String },
  roomPrice: { type: Number },
  totalMembers: { type: Number },
  members: { type: Number },
  verificationCode: { type: String },
  bookedBy: { type: String },
  bookedByName: { type: String },
  bookedByEmail: { type: String },
  phoneLegacy: { type: String }, // to prevent conflicts
  address: { type: String },
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: String, default: '' }
}, {
  timestamps: true
});

// Compound index for efficient booking lookups
bookingSchema.index({ roomId: 1, status: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);