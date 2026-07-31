const mongoose = require('mongoose');

const tourBookingSchema = new mongoose.Schema({
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
  tourName: { type: String, required: true },
  destination: { type: String, required: true },
  duration: { type: String, required: true },
  travelDate: { type: String, required: true },
  guests: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookedByName: { type: String, required: true },
  bookedByEmail: { type: String, required: true },
  bookedByPhone: { type: String, default: '' },
  deviceId: { type: String, default: '' },
  tourCoverImage: { type: String, default: '' },
  adults: { type: Number, default: 0 },
  children: { type: Number, default: 0 },
  country: { type: String, default: '' },
  address: { type: String, default: '' },
  paymentMethod: { type: String, default: 'pay_at_site' },
  status: { type: String, default: 'Confirmed' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TourBooking', tourBookingSchema);
