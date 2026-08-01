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
  gallery: [{ type: String }],
  shortDescription: { type: String },
  fullDescription: { type: String },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  
  // SEO fields
  seoTitle: { type: String },
  metaDescription: { type: String },
  keywords: { type: String },
  canonical: { type: String },
  schema: { type: String } // JSON-LD
}, { timestamps: true });

module.exports = mongoose.model('Attraction', attractionSchema);
