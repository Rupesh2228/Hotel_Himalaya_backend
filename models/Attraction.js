const mongoose = require('mongoose');

const attractionSchema = new mongoose.Schema({
  // Existing fields (kept for backward compatibility)
  title: { type: String, required: true },
  description: { type: String, required: false }, // Made optional if we switch to fullDescription
  subDescription: { type: String, default: '' },
  imageUrl: { type: String, required: false }, // Made optional if we switch to featuredImage
  link: { type: String, default: '#' },
  createdAt: { type: Date, default: Date.now },
  
  // New Fields
  slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  featuredImage: { type: String },
  gallery: { type: [String], default: [] },
  shortDescription: { type: String, default: '' },
  fullDescription: { type: String, default: '' },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  
  // SEO fields
  seoTitle: { type: String },
  metaDescription: { type: String },
  keywords: { type: String },
  canonical: { type: String },
  seoSchema: { type: String } // JSON-LD
}, { timestamps: true });

module.exports = mongoose.model('Attraction', attractionSchema);
