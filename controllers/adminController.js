const bcrypt = require('bcryptjs');
const User = require('../models/User');
const GalleryImage = require('../models/GalleryImage');
const GalleryCategory = require('../models/GalleryCategory');
const Room = require('../models/Room');
const Attraction = require('../models/Attraction');

const normalizePublicUrl = (req, value) => {
  if (!value || typeof value !== 'string') return value;
  try {
    const parsed = new URL(value);
    if ((parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && parsed.pathname.startsWith('/uploads/')) {
      return `${req.protocol}://${req.get('host')}${parsed.pathname}`;
    }
  } catch {
    if (value.startsWith('/uploads/')) {
      return `${req.protocol}://${req.get('host')}${value}`;
    }
  }
  return value;
};


// Get all users (for admin) with pagination
const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').skip(skip).limit(limit).lean().sort({ createdAt: -1 }),
      User.countDocuments()
    ]);

    res.json({
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Add a gallery category (admin)
const addGalleryCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    
    const existing = await GalleryCategory.findOne({ name });
    if (existing) return res.status(400).json({ error: 'Category already exists' });

    const category = await GalleryCategory.create({ name });
    res.status(201).json(category);
  } catch (err) {
    console.error('addGalleryCategory error:', err);
    res.status(500).json({ error: 'Failed to add category' });
  }
};

// Delete a gallery category (admin)
const deleteGalleryCategory = async (req, res) => {
  try {
    const category = await GalleryCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    
    // Optionally remove category from images
    await GalleryImage.updateMany({ category: req.params.id }, { $unset: { category: 1 } });
    
    res.json({ message: 'Category removed' });
  } catch (err) {
    console.error('deleteGalleryCategory error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

// Public: get all gallery categories
const getGalleryCategories = async (req, res) => {
  try {
    const categories = await GalleryCategory.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    console.error('getGalleryCategories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Add a gallery image (admin)
const addGalleryImage = async (req, res) => {
  try {
    const { url, title, description, category } = req.body;
    if (!url) return res.status(400).json({ error: 'Image URL is required' });

    const image = await GalleryImage.create({ url: normalizePublicUrl(req, url), title, description, category });
    await image.populate('category');
    res.status(201).json(image);
  } catch (err) {
    console.error('addGalleryImage error:', err);
    res.status(500).json({ error: 'Failed to add image' });
  }
};

// Public: get all gallery images with pagination and .lean()
const getGalleryImages = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      GalleryImage.find()
        .populate('category', 'name')
        .skip(skip)
        .limit(limit)
        .lean()
        .sort({ createdAt: -1 }),
      GalleryImage.countDocuments()
    ]);

    res.json({
      data: images.map((image) => ({
        ...image,
        url: normalizePublicUrl(req, image.url),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('getGalleryImages error:', err);
    res.status(500).json({ error: 'Failed to fetch gallery images' });
  }
};

// Add a room (admin)
const addRoom = async (req, res) => {
  try {
    const { title, description, price, totalMembers, images, isAvailable } = req.body;
    if (!title) return res.status(400).json({ error: 'Room title is required' });

    const room = await Room.create({
      title,
      description,
      price,
      totalMembers: Number(totalMembers) || 1,
      images: Array.isArray(images) ? images : (images ? images.split(',').map((s) => s.trim()) : []),
      isAvailable: isAvailable === undefined ? true : !!isAvailable,
    });
    res.status(201).json(room);
  } catch (err) {
    console.error('addRoom error:', err);
    res.status(500).json({ error: 'Failed to add room' });
  }
};

// Update a room (admin)
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, totalMembers, images, isAvailable } = req.body;
    if (!title) return res.status(400).json({ error: 'Room title is required' });

    const existingRoom = await Room.findById(id);
    if (!existingRoom) return res.status(404).json({ error: 'Room not found' });

    const normalizedImages = Array.isArray(images)
      ? images
      : (typeof images === 'string' && images.trim()
        ? images.split(',').map((s) => s.trim()).filter(Boolean)
        : existingRoom.images);

    const normalizedTotalMembers = totalMembers !== undefined && totalMembers !== null && totalMembers !== ''
      ? Number(totalMembers) || existingRoom.totalMembers || 1
      : existingRoom.totalMembers || 1;

    const updatePayload = {
      title,
      description,
      price,
      totalMembers: normalizedTotalMembers,
      images: normalizedImages,
    };

    // Allow admins to toggle availability explicitly
    if (typeof isAvailable !== 'undefined') {
      updatePayload.isAvailable = !!isAvailable;
    }

    const room = await Room.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    );
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    console.error('updateRoom error:', err);
    res.status(500).json({ error: 'Failed to update room' });
  }
};

// Delete a room (admin)
const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByIdAndDelete(id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error('deleteRoom error:', err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
};

// Public: get all rooms with pagination and .lean()
const getRooms = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      Room.find().skip(skip).limit(limit).lean().sort({ createdAt: -1 }),
      Room.countDocuments()
    ]);

    res.json({
      data: rooms,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('getRooms error:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

// Get all attractions with pagination and .lean()
const getAttractions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [attractions, total] = await Promise.all([
      Attraction.find().skip(skip).limit(limit).lean().sort({ createdAt: -1 }),
      Attraction.countDocuments()
    ]);

    res.json({
      data: attractions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('getAttractions error:', err);
    res.status(500).json({ error: 'Failed to fetch attractions' });
  }
};

// Get a single attraction by ID
const getAttractionById = async (req, res) => {
  try {
    const { id } = req.params;
    const attraction = await Attraction.findById(id);
    if (!attraction) return res.status(404).json({ error: 'Attraction not found' });
    res.json(attraction);
  } catch (err) {
    console.error('getAttractionById error:', err);
    res.status(500).json({ error: 'Failed to fetch attraction details' });
  }
};

// Add an attraction (admin)
const addAttraction = async (req, res) => {
  try {
    const { title, description, subDescription, imageUrl, link } = req.body;
    if (!title || !description || !imageUrl) {
      return res.status(400).json({ error: 'Title, description, and imageUrl are required' });
    }

    const attraction = await Attraction.create({
      title,
      description,
      subDescription: subDescription || '',
      imageUrl,
      link: link || '#',
    });
    res.status(201).json(attraction);
  } catch (err) {
    console.error('addAttraction error:', err);
    res.status(500).json({ error: 'Failed to add attraction' });
  }
};

// Update an attraction (admin)
const updateAttraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subDescription, imageUrl } = req.body;
    if (!title || !description || !imageUrl) {
      return res.status(400).json({ error: 'Title, description, and imageUrl are required' });
    }

    const attraction = await Attraction.findByIdAndUpdate(
      id,
      { title, description, subDescription: subDescription || '', imageUrl },
      { new: true }
    );
    if (!attraction) return res.status(404).json({ error: 'Attraction not found' });
    res.json(attraction);
  } catch (err) {
    console.error('updateAttraction error:', err);
    res.status(500).json({ error: 'Failed to update attraction' });
  }
};

// Delete an attraction (admin)
const deleteAttraction = async (req, res) => {
  try {
    const { id } = req.params;
    const attraction = await Attraction.findByIdAndDelete(id);
    if (!attraction) return res.status(404).json({ error: 'Attraction not found' });
    res.json({ message: 'Attraction deleted' });
  } catch (err) {
    console.error('deleteAttraction error:', err);
    res.status(500).json({ error: 'Failed to delete attraction' });
  }
};

// Delete a gallery image (admin)
const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await GalleryImage.findByIdAndDelete(id);
    if (!image) return res.status(404).json({ error: 'Gallery image not found' });
    res.json({ message: 'Gallery image deleted' });
  } catch (err) {
    console.error('deleteGalleryImage error:', err);
    res.status(500).json({ error: 'Failed to delete gallery image' });
  }
};

// Add admin (create or promote)
const addAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Name and Email are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists, change role to admin
      existingUser.role = 'admin';
      if (password) {
        const salt = await bcrypt.genSalt(10);
        existingUser.password = await bcrypt.hash(password, salt);
      }
      await existingUser.save();
      return res.json({ message: 'User role updated to admin successfully', user: { name: existingUser.name, email: existingUser.email, role: existingUser.role } });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required to create a new admin' });
    }

    // Create new admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      provider: 'local',
    });

    res.status(201).json({
      message: 'New admin created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('addAdmin error:', err);
    res.status(500).json({ error: 'Failed to add admin user' });
  }
};

// Update a user's role (admin)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin', 'pending_admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either user or admin' });
    }

    const targetUser = await User.findById(id).select('-password');
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'At least one admin account is required' });
      }
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({
      message: `User role updated to ${role}`,
      user: targetUser,
    });
  } catch (err) {
    console.error('updateUserRole error:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Delete a user (admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToDelete = await User.findById(id);

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToDelete.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the only admin account' });
      }
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = {
  getUsers,
  addGalleryImage,
  getGalleryImages,
  addRoom,
  updateRoom,
  deleteRoom,
  getRooms,
  getAttractions,
  getAttractionById,
  addAttraction,
  updateAttraction,
  deleteAttraction,
  deleteGalleryImage,
  addAdmin,
  updateUserRole,
  deleteUser,
  addGalleryCategory,
  deleteGalleryCategory,
  getGalleryCategories,
};
