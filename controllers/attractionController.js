const Attraction = require('../models/Attraction');
const asyncHandler = require('../utils/asyncHandler');
const { AppError: ErrorResponse } = require('../utils/errorHandler');

// @desc    Get all attractions
// @route   GET /api/attractions
// @access  Public
exports.getAttractions = asyncHandler(async (req, res, next) => {
  const attractions = await Attraction.find();
  res.status(200).json({
    success: true,
    count: attractions.length,
    data: attractions
  });
});

// @desc    Get single attraction by slug
// @route   GET /api/attractions/:slug
// @access  Public
exports.getAttractionBySlug = asyncHandler(async (req, res, next) => {
  const attraction = await Attraction.findOne({ slug: req.params.slug });
  if (!attraction) {
    return next(new ErrorResponse(`Attraction not found with slug of ${req.params.slug}`, 404));
  }
  res.status(200).json({
    success: true,
    data: attraction
  });
});

// @desc    Create new attraction
// @route   POST /api/attractions
// @access  Private/Admin
exports.createAttraction = asyncHandler(async (req, res, next) => {
  const payload = { ...req.body };
  payload.seoSchema = payload.seoSchema || payload.schema;
  delete payload.schema;
  const normalizedStatus = String(payload.status || 'Published').trim();
  payload.status = ['Published', 'Draft'].includes(normalizedStatus)
    ? normalizedStatus
    : 'Published';

  // Simple check for duplicate slug
  if (payload.slug) {
    const existing = await Attraction.findOne({ slug: payload.slug });
    if (existing) {
      return next(new ErrorResponse(`Slug already exists`, 400));
    }
  }

  // Ensure title is present
  if (!payload.title && payload.title !== undefined) {
      payload.title = payload.title || 'Untitled';
  }

  // Ensure old required fields are populated if they are empty
  if (!payload.description) payload.description = payload.shortDescription || 'No description';
  if (!payload.imageUrl) payload.imageUrl = payload.featuredImage || 'No image';

  const attraction = await Attraction.create(payload);
  res.status(201).json({
    success: true,
    data: attraction
  });
});

// @desc    Update attraction
// @route   PUT /api/attractions/:id
// @access  Private/Admin
exports.updateAttraction = asyncHandler(async (req, res, next) => {
  let attraction = await Attraction.findById(req.params.id);
  if (!attraction) {
    return next(new ErrorResponse(`Attraction not found with id of ${req.params.id}`, 404));
  }

  // Check duplicate slug if slug is changed
  if (req.body.slug && req.body.slug !== attraction.slug) {
    const existing = await Attraction.findOne({ slug: req.body.slug });
    if (existing) {
      return next(new ErrorResponse(`Slug already exists`, 400));
    }
  }

  // Keep old fields synced
  const payload = { ...req.body };
  payload.seoSchema = payload.seoSchema || payload.schema;
  delete payload.schema;
  if (payload.shortDescription) payload.description = payload.shortDescription;
  if (payload.featuredImage) payload.imageUrl = payload.featuredImage;
  if (payload.status) {
    const normalizedStatus = String(payload.status).trim();
    payload.status = ['Published', 'Draft'].includes(normalizedStatus)
      ? normalizedStatus
      : attraction.status;
  }

  attraction = await Attraction.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: attraction
  });
});

// @desc    Delete attraction
// @route   DELETE /api/attractions/:id
// @access  Private/Admin
exports.deleteAttraction = asyncHandler(async (req, res, next) => {
  const attraction = await Attraction.findById(req.params.id);
  if (!attraction) {
    return next(new ErrorResponse(`Attraction not found with id of ${req.params.id}`, 404));
  }
  await attraction.deleteOne();
  res.status(200).json({
    success: true,
    data: {}
  });
});
