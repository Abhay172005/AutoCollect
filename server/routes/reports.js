const express = require('express');
const router = express.Router();
const { getReport, exportReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/export/:type', protect, exportReport);
router.get('/:type', protect, getReport);

module.exports = router;
