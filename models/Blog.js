const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  featuredImage: {
    type: String,
    required: true
  },
  gallery: [{
    type: String
  }],
  shortDescription: {
    type: String,
    required: true
  },
  fullDescription: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Published'],
    default: 'Draft'
  },
  seoTitle: String,
  metaDescription: String,
  keywords: String,
  canonical: String,
  schema: String // JSON-LD
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
