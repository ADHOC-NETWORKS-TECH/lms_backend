const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const blogController = require('../controllers/blogController');

// Public routes
router.get('/', blogController.getBlogs);
router.get('/slug/:slug', blogController.getBlogBySlug);

// Admin routes
router.use(protect, adminOnly);
router.get('/admin/all', blogController.getAllBlogs);
router.post('/', blogController.createBlog);
router.put('/:id', blogController.updateBlog);
router.delete('/:id', blogController.deleteBlog);

module.exports = router;
