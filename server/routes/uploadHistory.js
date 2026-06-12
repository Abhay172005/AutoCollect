const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUploadHistories, getUploadHistory } = require('../controllers/uploadHistoryController');

router.use(protect);

router.get('/', getUploadHistories);
router.get('/:id', getUploadHistory);

module.exports = router;
