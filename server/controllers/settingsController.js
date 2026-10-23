'use strict';

const Settings = require('../models/Settings');
const {
  OLD_DEFAULT_TEMPLATE,
  DEFAULT_REMINDER_TEMPLATE
} = require('../models/Settings');

// @desc    Get settings
// @route   GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ merchantId: req.user.id });

    if (!settings) {
      // New merchant — creates a document with the new default template
      settings = await Settings.create({ merchantId: req.user.id });
    } else if (settings.defaultReminderTemplate === OLD_DEFAULT_TEMPLATE) {
      // Existing document still has the old default template — migrate it.
      // Only exact matches are migrated; genuinely customised templates are left untouched.
      settings.defaultReminderTemplate = DEFAULT_REMINDER_TEMPLATE;
      await settings.save();
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
