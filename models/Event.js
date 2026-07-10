const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true }, // e.g. "2026-07-01"
  time: { type: String, required: true }, // e.g. "18:00"
  price: { type: Number, required: true, default: 0 },
  location: { type: String, required: true },
  availableSeats: { type: Number, required: true, default: 50 },
  totalSeats: { type: Number, required: true, default: 50 },
  imageUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', eventSchema);
