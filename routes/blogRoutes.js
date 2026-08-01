const express = require('express');
const {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog
} = require('../controllers/blogController');

const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(getBlogs)
  .post(protect, isAdmin, createBlog);

router.route('/slug/:slug').get(getBlogBySlug);

router
  .route('/:id')
  .put(protect, isAdmin, updateBlog)
  .delete(protect, isAdmin, deleteBlog);

module.exports = router;
