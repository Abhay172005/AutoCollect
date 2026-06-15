const User = require('../models/User');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// @desc    Login admin
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        businessName: user.businessName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new merchant
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, businessName, email, mobile, password } = req.body;

    if (!name || !businessName || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      businessName,
      email,
      mobile,
      password,
      role: 'admin' // By default merchants are admin of their tenant
    });

    // Auto-create settings for this new merchant
    await Settings.create({
      merchantId: user._id,
      merchantName: name,
      businessName: businessName,
      adminEmail: email
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        businessName: user.businessName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password placeholder
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    // Placeholder implementation
    res.json({ success: true, message: 'Password reset link sent to your email (Placeholder)' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
