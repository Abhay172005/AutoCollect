const Bill = require('../models/Bill');
const ReminderHistory = require('../models/ReminderHistory');
const mongoose = require('mongoose');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalPending,
      dueToday,
      overdue,
      partiallyPaid,
      paid,
      outstandingResult,
      remindersSentToday
    ] = await Promise.all([
      Bill.countDocuments({ merchantId: req.user.id, status: { $in: ['Upcoming', 'Due Today', 'Overdue'] } }),
      Bill.countDocuments({ merchantId: req.user.id, status: 'Due Today' }),
      Bill.countDocuments({ merchantId: req.user.id, status: 'Overdue' }),
      Bill.countDocuments({ merchantId: req.user.id, status: 'Partially Paid' }),
      Bill.countDocuments({ merchantId: req.user.id, status: 'Paid' }),
      Bill.aggregate([
        { $match: { merchantId: new mongoose.Types.ObjectId(req.user.id), status: { $ne: 'Paid' } } },
        { $group: { _id: null, total: { $sum: '$balanceAmount' } } }
      ]),
      ReminderHistory.countDocuments({
        merchantId: req.user.id,
        sentAt: { $gte: today, $lt: tomorrow },
        status: 'Sent'
      })
    ]);

    const totalOutstanding = outstandingResult.length > 0 ? outstandingResult[0].total : 0;

    res.json({
      success: true,
      data: {
        totalPending,
        dueToday,
        overdue,
        partiallyPaid,
        paid,
        totalOutstanding,
        remindersSentToday
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Outstanding amount by customer
// @route   GET /api/dashboard/outstanding-by-customer
exports.getOutstandingByCustomer = async (req, res) => {
  try {
    const data = await Bill.aggregate([
      { $match: { merchantId: new mongoose.Types.ObjectId(req.user.id), status: { $ne: 'Paid' }, balanceAmount: { $gt: 0 } } },
      { $group: { _id: '$partyName', totalOutstanding: { $sum: '$balanceAmount' } } },
      { $sort: { totalOutstanding: -1 } },
      { $limit: 10 },
      { $project: { partyName: '$_id', totalOutstanding: 1, _id: 0 } }
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Overdue bills trend (last 30 days)
// @route   GET /api/dashboard/overdue-trend
exports.getOverdueTrend = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await Bill.aggregate([
      { $match: { merchantId: new mongoose.Types.ObjectId(req.user.id), dueDate: { $gte: thirtyDaysAgo }, status: 'Overdue' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$dueDate' } },
          count: { $sum: 1 },
          amount: { $sum: '$balanceAmount' }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, amount: 1, _id: 0 } }
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Collection status pie chart
// @route   GET /api/dashboard/collection-status
exports.getCollectionStatus = async (req, res) => {
  try {
    const data = await Bill.aggregate([
      { $match: { merchantId: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$balanceAmount' } } },
      { $project: { status: '$_id', count: 1, amount: 1, _id: 0 } }
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Recent activities
// @route   GET /api/dashboard/recent-activities
exports.getRecentActivities = async (req, res) => {
  try {
    const [recentBills, recentReminders] = await Promise.all([
      Bill.find({ merchantId: req.user.id }).sort({ updatedAt: -1 }).limit(5).select('partyName billNumber status balanceAmount updatedAt'),
      ReminderHistory.find({ merchantId: req.user.id }).sort({ sentAt: -1 }).limit(5).select('partyName billNumber status reminderType sentAt')
    ]);

    const activities = [
      ...recentBills.map(b => ({
        type: 'bill',
        partyName: b.partyName,
        billNumber: b.billNumber,
        description: `Bill ${b.billNumber} - ${b.status}`,
        amount: b.balanceAmount,
        date: b.updatedAt
      })),
      ...recentReminders.map(r => ({
        type: 'reminder',
        partyName: r.partyName,
        billNumber: r.billNumber,
        description: `Reminder sent via ${r.reminderType} - ${r.status}`,
        date: r.sentAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get notification counts
// @route   GET /api/dashboard/notifications
exports.getNotifications = async (req, res) => {
  try {
    const [dueToday, overdue, pendingReminders, partiallyPaid] = await Promise.all([
      Bill.countDocuments({ merchantId: req.user.id, status: 'Due Today' }),
      Bill.countDocuments({ merchantId: req.user.id, status: 'Overdue' }),
      Bill.countDocuments({
        merchantId: req.user.id,
        status: { $in: ['Due Today', 'Overdue'] },
        reminderSent: false
      }),
      Bill.countDocuments({ merchantId: req.user.id, status: 'Partially Paid' })
    ]);

    const notifications = [];
    if (dueToday > 0) notifications.push({ type: 'warning', message: `${dueToday} bills due today` });
    if (overdue > 0) notifications.push({ type: 'danger', message: `${overdue} overdue invoices` });
    if (pendingReminders > 0) notifications.push({ type: 'info', message: `${pendingReminders} reminders pending` });
    if (partiallyPaid > 0) notifications.push({ type: 'success', message: `${partiallyPaid} partially paid invoices` });

    res.json({ success: true, data: notifications, count: notifications.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
