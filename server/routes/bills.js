const express = require('express');
const router = express.Router();
const { getBills, getBill, updateBill, exportCSV, createBill, recordPayment, bulkDeleteBills } = require('../controllers/billController');
const { protect } = require('../middleware/auth');

router.get('/export/csv', protect, exportCSV);
router.post('/bulk-delete', protect, bulkDeleteBills);
router.post('/', protect, createBill);
router.get('/', protect, getBills);
router.get('/:id', protect, getBill);
router.patch('/:id/payment', protect, recordPayment);
router.patch('/:id', protect, updateBill);

module.exports = router;
