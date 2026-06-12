const express = require('express');
const router = express.Router();
const { uploadPdfExtract, uploadPdfConfirm, uploadManual } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/extract', protect, upload.single('pdf'), uploadPdfExtract);
router.post('/confirm', protect, uploadPdfConfirm);
router.post('/manual', protect, uploadManual);

module.exports = router;
