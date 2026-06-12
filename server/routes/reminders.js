const express = require('express');
const router = express.Router();
const { getDueBills, previewReminder, sendReminderCtrl, sendBulkRemindersCtrl, getReminderHistory } = require('../controllers/reminderController');
const { protect } = require('../middleware/auth');

router.get('/due', protect, getDueBills);
router.get('/preview/:billId', protect, previewReminder);
router.post('/send', protect, sendReminderCtrl);
router.post('/send-bulk', protect, sendBulkRemindersCtrl);
router.get('/history', protect, getReminderHistory);

module.exports = router;
