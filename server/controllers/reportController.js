const Bill = require('../models/Bill');
const ReminderHistory = require('../models/ReminderHistory');

// @desc    Get report data
// @route   GET /api/reports/:type
exports.getReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, partyName } = req.query;
    let query = {};
    let data;

    // Date range filter
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    if (partyName) query.partyName = { $regex: partyName, $options: 'i' };

    switch (type) {
      case 'pending':
        query.status = { $in: ['Upcoming', 'Due Today', 'Overdue'] };
        data = await Bill.find(query).sort({ dueDate: 1 });
        break;
      case 'overdue':
        query.status = 'Overdue';
        data = await Bill.find(query).sort({ dueDate: 1 });
        break;
      case 'paid':
        query.status = 'Paid';
        data = await Bill.find(query).sort({ updatedAt: -1 });
        break;
      case 'partial':
        query.status = 'Partially Paid';
        data = await Bill.find(query).sort({ updatedAt: -1 });
        break;
      case 'reminders':
        const reminderQuery = {};
        if (partyName) reminderQuery.partyName = { $regex: partyName, $options: 'i' };
        if (startDate || endDate) {
          reminderQuery.sentAt = {};
          if (startDate) reminderQuery.sentAt.$gte = new Date(startDate);
          if (endDate) reminderQuery.sentAt.$lte = new Date(endDate);
        }
        data = await ReminderHistory.find(reminderQuery).sort({ sentAt: -1 });
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    // Calculate summary
    let totalAmount = 0;
    let totalBalance = 0;
    if (type !== 'reminders' && data.length > 0) {
      totalAmount = data.reduce((sum, bill) => sum + (bill.billAmount || 0), 0);
      totalBalance = data.reduce((sum, bill) => sum + (bill.balanceAmount || 0), 0);
    }

    res.json({
      success: true,
      data,
      summary: {
        count: data.length,
        totalAmount,
        totalBalance,
        reportType: type
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export report as CSV
// @route   GET /api/reports/export/:type
exports.exportReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, partyName } = req.query;
    let query = {};
    let data;
    let fields;

    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    if (partyName) query.partyName = { $regex: partyName, $options: 'i' };

    if (type === 'reminders') {
      const reminderQuery = {};
      if (partyName) reminderQuery.partyName = { $regex: partyName, $options: 'i' };
      data = await ReminderHistory.find(reminderQuery).sort({ sentAt: -1 });
      fields = ['partyName', 'billNumber', 'phoneNumber', 'reminderType', 'status', 'sentAt', 'message'];
    } else {
      const statusMap = {
        pending: { $in: ['Upcoming', 'Due Today', 'Overdue'] },
        overdue: 'Overdue',
        paid: 'Paid',
        partial: 'Partially Paid'
      };
      query.status = statusMap[type];
      data = await Bill.find(query).sort({ dueDate: 1 });
      fields = ['partyName', 'billNumber', 'billDate', 'creditDays', 'dueDate', 'billAmount', 'balanceAmount', 'status'];
    }

    const { Parser } = require('json2csv');
    const parser = new Parser({ fields });
    const csv = parser.parse(data.map(d => {
      const obj = d.toObject();
      if (obj.billDate) obj.billDate = new Date(obj.billDate).toLocaleDateString('en-IN');
      if (obj.dueDate) obj.dueDate = new Date(obj.dueDate).toLocaleDateString('en-IN');
      if (obj.sentAt) obj.sentAt = new Date(obj.sentAt).toLocaleString('en-IN');
      return obj;
    }));

    res.header('Content-Type', 'text/csv');
    res.attachment(`${type}-report.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
