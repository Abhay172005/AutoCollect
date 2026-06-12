const Bill = require('../models/Bill');
const ReminderHistory = require('../models/ReminderHistory');
const { generateReminderMessage, sendReminder, sendBulkReminders } = require('../services/reminderService');

// @desc    Get bills due for reminders
// @route   GET /api/reminders/due
exports.getDueBills = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bills = await Bill.find({
      status: { $in: ['Due Today', 'Overdue', 'Partially Paid'] },
      balanceAmount: { $gt: 0 }
    }).sort({ dueDate: 1 });

    const grouped = {
      dueToday: [],
      overdue3Days: [],
      overdue7Days: [],
      overdue15Days: [],
      other: []
    };

    bills.forEach(bill => {
      if (!bill.dueDate) return;
      const due = new Date(bill.dueDate);
      due.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) grouped.dueToday.push(bill);
      else if (diffDays === 3) grouped.overdue3Days.push(bill);
      else if (diffDays === 7) grouped.overdue7Days.push(bill);
      else if (diffDays === 15) grouped.overdue15Days.push(bill);
      else grouped.other.push(bill);
    });

    res.json({ success: true, data: grouped, count: bills.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Preview reminder message
// @route   GET /api/reminders/preview/:billId
exports.previewReminder = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.billId);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const message = await generateReminderMessage(bill);
    res.json({ success: true, data: { message, bill } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send reminder
// @route   POST /api/reminders/send
exports.sendReminderCtrl = async (req, res) => {
  try {
    const { billId, reminderType = 'WhatsApp' } = req.body;

    if (!billId) {
      return res.status(400).json({ success: false, message: 'Bill ID is required' });
    }

    const result = await sendReminder(billId, reminderType);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send bulk reminders
// @route   POST /api/reminders/send-bulk
exports.sendBulkRemindersCtrl = async (req, res) => {
  try {
    const { billIds, reminderType = 'WhatsApp' } = req.body;

    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Bill IDs are required' });
    }

    const results = await sendBulkReminders(billIds, reminderType);
    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: { total: results.length, sent, failed, details: results }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reminder history
// @route   GET /api/reminder-history
exports.getReminderHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      partyName,
      status,
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (partyName) query.partyName = { $regex: partyName, $options: 'i' };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.sentAt = {};
      if (startDate) query.sentAt.$gte = new Date(startDate);
      if (endDate) query.sentAt.$lte = new Date(endDate);
    }

    const total = await ReminderHistory.countDocuments(query);
    const reminders = await ReminderHistory.find(query)
      .sort({ sentAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: reminders,
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
