const express = require('express');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createBlogValidator, updateBlogValidator } = require('../validators/blog.validator');
const {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog
} = require('../controllers/blogController');

const router = express.Router();

router
  .route('/')
  .get(getBlogs)
  .post(protect, isAdmin, createBlogValidator, validate, createBlog);

router.route('/slug/:slug').get(getBlogBySlug);

router
  .route('/:id')
  .put(protect, isAdmin, updateBlogValidator, validate, updateBlog)
  .delete(protect, isAdmin, deleteBlog);

module.exports = router;
