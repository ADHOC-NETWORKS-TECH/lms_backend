const { Blog, User } = require('../models/associations');
// Simple slugify function
const createSlug = (title) => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

// Get all published blogs (Public)
exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      where: { status: 'published' },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: blogs });
  } catch (error) {
        res.status(500).json({ success: false, message: error.message });
  }
};

// Get single blog (Public)
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({
      where: { slug },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }]
    });
    
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    res.json({ success: true, data: blog });
  } catch (error) {
        res.status(500).json({ success: false, message: error.message });
  }
};

// Get all blogs (Admin)
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: blogs });
  } catch (error) {
        res.status(500).json({ success: false, message: error.message });
  }
};

// Create blog (Admin)
exports.createBlog = async (req, res) => {
  try {
    const { title, content, imageUrl, status } = req.body;
    const authorId = req.user.id;
    
    let slug = createSlug(title);
    
    // Ensure unique slug
    let existing = await Blog.findOne({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }
    
    const blog = await Blog.create({
      title,
      slug,
      content,
      imageUrl,
      status: status || 'published',
      authorId
    });
    
    res.status(201).json({ success: true, message: 'Blog created successfully', data: blog });
  } catch (error) {
        res.status(500).json({ success: false, message: error.message });
  }
};

// Update blog (Admin)
exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, imageUrl, status } = req.body;
    
    const blog = await Blog.findByPk(id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    let slug = blog.slug;
    if (title && title !== blog.title) {
      slug = createSlug(title);
      let existing = await Blog.findOne({ where: { slug } });
      if (existing && existing.id !== id) {
        slug = `${slug}-${Date.now()}`;
      }
    }
    
    await blog.update({
      title: title || blog.title,
      slug,
      content: content || blog.content,
      imageUrl: imageUrl !== undefined ? imageUrl : blog.imageUrl,
      status: status || blog.status
    });
    
    res.json({ success: true, message: 'Blog updated successfully', data: blog });
  } catch (error) {
        res.status(500).json({ success: false, message: error.message });
  }
};

// Delete blog (Admin)
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByPk(id);
    
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    await blog.destroy();
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
        res.status(500).json({ success: false, message: error.message });
  }
};

