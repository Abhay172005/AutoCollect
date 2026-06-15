const Settings = require('../models/Settings');

// @desc    Get settings
// @route   GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ merchantId: req.user.id });
    if (!settings) {
      settings = await Settings.create({ merchantId: req.user.id });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ merchantId: req.user.id });
    if (!settings) {
      settings = new Settings({ ...req.body, merchantId: req.user.id });
    } else {
      Object.keys(req.body).forEach(key => {
        settings[key] = req.body[key];
      });
    }
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
