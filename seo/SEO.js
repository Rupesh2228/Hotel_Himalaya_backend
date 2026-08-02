const mongoose = require('mongoose');

const seoSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'Home',
      'About',
      'Rooms',
      'Tours',
      'Events',
      'Gallery',
      'Attractions', // Replaced Attraction Places to simpler code representation
      'Blogs',
      'Contact'
    ]
  },
  title: {
    type: String,
    required: true
  },
  metaDescription: {
    type: String
  },
  keywords: {
    type: String
  },
  canonical: {
    type: String
  },
  seoSchema: {
    type: String // JSON-LD
  }
}, { timestamps: true });

module.exports = mongoose.model('SEO', seoSchema);
