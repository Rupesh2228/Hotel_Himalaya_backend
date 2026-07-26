const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  totalMembers: { type: Number, default: 2 },
  images: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('Room', roomSchema);
