const mongoose = require('mongoose');

const attractionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  subDescription: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  link: { type: String, default: '#' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Attraction', attractionSchema);
