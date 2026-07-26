const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'GalleryCategory', index: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
