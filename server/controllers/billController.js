const Bill = require('../models/Bill');
const Party = require('../models/Party');

// @desc    Get all bills with search, filter, sort, pagination
// @route   GET /api/bills
exports.getBills = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      partyName,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate
    } = req.query;

    const query = { merchantId: req.user.id };

    // Search
    if (search) {
      query.$or = [
        { partyName: { $regex: search, $options: 'i' } },
        { billNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (status) query.status = status;
    if (partyName) query.partyName = { $regex: partyName, $options: 'i' };
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    const total = await Bill.countDocuments(query);
    const bills = await Bill.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: bills,
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

// @desc    Create a manual bill
// @route   POST /api/bills
exports.createBill = async (req, res) => {
  try {
    const {
      partyName, city, billNumber, billDate, creditDays, billAmount, notes
    } = req.body;

    if (!partyName || !billNumber || !billDate || billAmount == null) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const Party = require('../models/Party');
    // Auto-create party if it doesn't exist
    let party = await Party.findOne({ merchantId: req.user.id, partyName });
    if (!party) {
      party = await Party.create({
        merchantId: req.user.id,
        partyName,
        city: city || '',
        phoneNumber: '+918769744939' // Hardcoded for POC demo
      });
    } else if (!party.phoneNumber) {
      party.phoneNumber = '+918769744939';
      await party.save();
    }

    const bill = new Bill({
      merchantId: req.user.id,
      partyName,
      billNumber,
      billDate,
      creditDays: creditDays || 30,
      billAmount,
      balanceAmount: billAmount, // initially balance is same as amount
      cumulativeAmount: billAmount,
      notes
    });

    await bill.save();
    
    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Bill number already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single bill
// @route   GET /api/bills/:id
exports.getBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, merchantId: req.user.id });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update bill
// @route   PATCH /api/bills/:id
exports.updateBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, merchantId: req.user.id });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const allowedFields = [
      'partyName', 'city', 'phoneNumber', 'billNumber', 'billDate', 
      'creditDays', 'billAmount', 'balanceAmount', 'cumulativeAmount', 
      'notes', 'status'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        bill[field] = req.body[field];
      }
    });

    await bill.save();
    res.json({ success: true, data: bill });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Bill number already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record a payment for a bill
// @route   PATCH /api/bills/:id/payment
exports.recordPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (amount == null || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid payment amount' });
    }

    const bill = await Bill.findOne({ _id: req.params.id, merchantId: req.user.id });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const previousBalance = bill.balanceAmount;
    const newBalance = previousBalance - amount;

    if (newBalance < 0) {
      return res.status(400).json({ success: false, message: 'Payment amount exceeds balance' });
    }

    bill.balanceAmount = newBalance;
    
    if (newBalance === 0) {
      bill.status = 'Paid';
    } else {
      bill.status = 'Partially Paid';
    }

    bill.paymentHistory.push({
      date: new Date(),
      previousBalance,
      newBalance,
      changeAmount: amount
    });

    await bill.save();
    
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export bills as CSV
// @route   GET /api/bills/export/csv
exports.exportCSV = async (req, res) => {
  try {
    const { status, partyName, startDate, endDate } = req.query;
    const query = { merchantId: req.user.id };

    if (status) query.status = status;
    if (partyName) query.partyName = { $regex: partyName, $options: 'i' };
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    const bills = await Bill.find(query).sort({ createdAt: -1 });

    const { Parser } = require('json2csv');
    const fields = [
      'partyName', 'billNumber', 'billDate', 'creditDays', 'dueDate',
      'billAmount', 'balanceAmount', 'cumulativeAmount', 'status', 'reminderSent'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(bills.map(b => ({
      ...b.toObject(),
      billDate: b.billDate ? new Date(b.billDate).toLocaleDateString('en-IN') : '',
      dueDate: b.dueDate ? new Date(b.dueDate).toLocaleDateString('en-IN') : ''
    })));

    res.header('Content-Type', 'text/csv');
    res.attachment('bills-export.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk delete bills
// @route   POST /api/bills/bulk-delete
exports.bulkDeleteBills = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of bill IDs to delete' });
    }

    const result = await Bill.deleteMany({ _id: { $in: ids }, merchantId: req.user.id });
    res.json({ success: true, message: `${result.deletedCount} bills deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
