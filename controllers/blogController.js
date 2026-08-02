const Blog = require('../models/Blog');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorHandler');

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = asyncHandler(async (req, res, next) => {
  const blogs = await Blog.find();
  res.status(200).json({
    success: true,
    count: blogs.length,
    data: blogs
  });
});

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = asyncHandler(async (req, res, next) => {
  const blog = await Blog.findOne({ slug: req.params.slug });
  if (!blog) {
    return next(new ErrorResponse(`Blog not found with slug of ${req.params.slug}`, 404));
  }
  res.status(200).json({
    success: true,
    data: blog
  });
});

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private/Admin
exports.createBlog = asyncHandler(async (req, res, next) => {
  const payload = { ...req.body };
  payload.seoSchema = payload.seoSchema || payload.schema;
  delete payload.schema;
  const normalizedStatus = String(payload.status || 'Published').trim();
  payload.status = ['Published', 'Draft'].includes(normalizedStatus)
    ? normalizedStatus
    : 'Published';

  if (payload.slug) {
    const existing = await Blog.findOne({ slug: payload.slug });
    if (existing) {
      return next(new ErrorResponse(`Slug already exists`, 400));
    }
  }

  const blog = await Blog.create(payload);
  res.status(201).json({
    success: true,
    data: blog
  });
});

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
exports.updateBlog = asyncHandler(async (req, res, next) => {
  let blog = await Blog.findById(req.params.id);
  if (!blog) {
    return next(new ErrorResponse(`Blog not found with id of ${req.params.id}`, 404));
  }

  if (req.body.slug && req.body.slug !== blog.slug) {
    const existing = await Blog.findOne({ slug: req.body.slug });
    if (existing) {
      return next(new ErrorResponse(`Slug already exists`, 400));
    }
  }

  const payload = { ...req.body };
  payload.seoSchema = payload.seoSchema || payload.schema;
  delete payload.schema;
  if (payload.status) {
    const normalizedStatus = String(payload.status).trim();
    payload.status = ['Published', 'Draft'].includes(normalizedStatus)
      ? normalizedStatus
      : blog.status;
  }

  blog = await Blog.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: blog
  });
});

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
exports.deleteBlog = asyncHandler(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return next(new ErrorResponse(`Blog not found with id of ${req.params.id}`, 404));
  }
  await blog.deleteOne();
  res.status(200).json({
    success: true,
    data: {}
  });
});
