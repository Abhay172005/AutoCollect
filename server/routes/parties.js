const express = require('express');
const router = express.Router();
const { getParties, addParty, updateParty, deleteParty, getMissingPhone, getCities, bulkDeleteParties } = require('../controllers/partyController');
const { protect } = require('../middleware/auth');

router.post('/bulk-delete', protect, bulkDeleteParties);
router.get('/missing-phone', protect, getMissingPhone);
router.get('/cities', protect, getCities);
router.get('/', protect, getParties);
router.post('/', protect, addParty);
router.put('/:id', protect, updateParty);
router.delete('/:id', protect, deleteParty);

module.exports = router;
