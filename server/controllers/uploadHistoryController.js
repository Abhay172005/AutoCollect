const UploadHistory = require('../models/UploadHistory');

// @desc    Get all upload histories
// @route   GET /api/upload-history
exports.getUploadHistories = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const total = await UploadHistory.countDocuments({ merchantId: req.user.id });
    const histories = await UploadHistory.find({ merchantId: req.user.id })
      .sort({ uploadDate: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: histories,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single upload history by ID
// @route   GET /api/upload-history/:id
exports.getUploadHistory = async (req, res) => {
  try {
    const history = await UploadHistory.findOne({ _id: req.params.id, merchantId: req.user.id });
    if (!history) {
      return res.status(404).json({ success: false, message: 'Upload history not found' });
    }
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
