const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'GalleryCategory' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
