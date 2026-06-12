const express = require('express');
const router = express.Router();
const { getStats, getOutstandingByCustomer, getOverdueTrend, getCollectionStatus, getRecentActivities, getNotifications } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, getStats);
router.get('/outstanding-by-customer', protect, getOutstandingByCustomer);
router.get('/overdue-trend', protect, getOverdueTrend);
router.get('/collection-status', protect, getCollectionStatus);
router.get('/recent-activities', protect, getRecentActivities);
router.get('/notifications', protect, getNotifications);

module.exports = router;
