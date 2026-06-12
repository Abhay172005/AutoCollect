const Party = require('../models/Party');

// @desc    Get all parties with search and filter
// @route   GET /api/parties
exports.getParties = async (req, res) => {
  try {
    const { search = '', city, page = 1, limit = 50, missingPhone } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { partyName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    if (city) query.city = { $regex: city, $options: 'i' };
    if (missingPhone === 'true') {
      query.$or = [{ phoneNumber: '' }, { phoneNumber: { $exists: false } }];
    }

    const total = await Party.countDocuments(query);
    const parties = await Party.find(query)
      .sort({ partyName: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: parties,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new party
// @route   POST /api/parties
exports.addParty = async (req, res) => {
  try {
    const { partyName, phoneNumber, city, email, notes } = req.body;

    if (!partyName) {
      return res.status(400).json({ success: false, message: 'Party name is required' });
    }

    const existing = await Party.findOne({ partyName });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Party already exists' });
    }

    const finalPhone = phoneNumber && phoneNumber.trim() !== '' ? phoneNumber : '+918769744939';
    
    const party = await Party.create({ partyName, phoneNumber: finalPhone, city, email, notes });
    res.status(201).json({ success: true, data: party });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update party
// @route   PUT /api/parties/:id
exports.updateParty = async (req, res) => {
  try {
    const party = await Party.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!party) {
      return res.status(404).json({ success: false, message: 'Party not found' });
    }

    res.json({ success: true, data: party });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete party
// @route   DELETE /api/parties/:id
exports.deleteParty = async (req, res) => {
  try {
    const party = await Party.findByIdAndDelete(req.params.id);
    if (!party) {
      return res.status(404).json({ success: false, message: 'Party not found' });
    }
    res.json({ success: true, message: 'Party deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get parties with missing phone numbers
// @route   GET /api/parties/missing-phone
exports.getMissingPhone = async (req, res) => {
  try {
    const parties = await Party.find({
      $or: [{ phoneNumber: '' }, { phoneNumber: { $exists: false } }, { phoneNumber: null }]
    }).sort({ partyName: 1 });

    res.json({ success: true, data: parties, count: parties.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all unique cities
// @route   GET /api/parties/cities
exports.getCities = async (req, res) => {
  try {
    const cities = await Party.distinct('city', { city: { $ne: '' } });
    res.json({ success: true, data: cities.sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk delete parties
// @route   POST /api/parties/bulk-delete
exports.bulkDeleteParties = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of party IDs to delete' });
    }

    const result = await Party.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${result.deletedCount} parties deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
