const bcrypt = require('bcryptjs');
const User = require('../models/User');
const GalleryImage = require('../models/GalleryImage');
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

// Get all users (for admin)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Add a gallery image (admin)
const addGalleryImage = async (req, res) => {
  try {
    const { url, title, description } = req.body;
    if (!url) return res.status(400).json({ error: 'Image URL is required' });

    const image = await GalleryImage.create({ url: normalizePublicUrl(req, url), title, description });
    res.status(201).json(image);
  } catch (err) {
    console.error('addGalleryImage error:', err);
    res.status(500).json({ error: 'Failed to add image' });
  }
};

// Public: get all gallery images
const getGalleryImages = async (req, res) => {
  try {
    const images = await GalleryImage.find().sort({ createdAt: -1 }).lean();
    res.json(images.map((image) => ({
      ...image,
      url: normalizePublicUrl(req, image.url),
    })));
  } catch (err) {
    console.error('getGalleryImages error:', err);
    res.status(500).json({ error: 'Failed to fetch gallery images' });
  }
};

// Add a room (admin)
const addRoom = async (req, res) => {
  try {
    const { title, description, price, totalMembers, images } = req.body;
    if (!title) return res.status(400).json({ error: 'Room title is required' });

    const room = await Room.create({
      title,
      description,
      price,
      totalMembers: Number(totalMembers) || 1,
      images: Array.isArray(images) ? images : (images ? images.split(',').map((s) => s.trim()) : []),
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
    const { title, description, price, totalMembers, images } = req.body;
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

    const room = await Room.findByIdAndUpdate(
      id,
      {
        title,
        description,
        price,
        totalMembers: normalizedTotalMembers,
        images: normalizedImages,
      },
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

// Public: get all rooms
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    console.error('getRooms error:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

// Get all attractions
const getAttractions = async (req, res) => {
  try {
    const attractions = await Attraction.find().sort({ createdAt: -1 });
    res.json(attractions);
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

    if (!['user', 'admin'].includes(role)) {
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
};
