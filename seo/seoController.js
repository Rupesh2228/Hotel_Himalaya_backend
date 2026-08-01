const SEO = require('./SEO');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorHandler');

// @desc    Get SEO by page
// @route   GET /api/seo/:page
// @access  Public
exports.getSEOByPage = asyncHandler(async (req, res, next) => {
  const seo = await SEO.findOne({ page: req.params.page });
  if (!seo) {
    // If no SEO found, just return empty data without error to avoid breaking frontend
    return res.status(200).json({
      success: true,
      data: null
    });
  }
  res.status(200).json({
    success: true,
    data: seo
  });
});

// @desc    Update SEO by page (or create if doesn't exist)
// @route   PUT /api/seo/:page
// @access  Private/Admin
exports.updateSEOByPage = asyncHandler(async (req, res, next) => {
  let seo = await SEO.findOne({ page: req.params.page });

  if (!seo) {
    // Create new
    seo = await SEO.create({ ...req.body, page: req.params.page });
  } else {
    // Update existing
    seo = await SEO.findOneAndUpdate({ page: req.params.page }, req.body, {
      new: true,
      runValidators: true
    });
  }

  res.status(200).json({
    success: true,
    data: seo
  });
});

// @desc    Get all global SEO settings
// @route   GET /api/seo
// @access  Private/Admin
exports.getAllSEO = asyncHandler(async (req, res, next) => {
  const seos = await SEO.find();
  res.status(200).json({
    success: true,
    count: seos.length,
    data: seos
  });
});
