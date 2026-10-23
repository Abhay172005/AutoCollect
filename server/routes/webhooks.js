'use strict';

const express = require('express');
const router  = express.Router();
const { verifyWebhook, handleWebhookEvent } = require('../controllers/webhookController');

// GET  /api/webhooks/whatsapp — Meta subscription verification
router.get('/whatsapp', verifyWebhook);

// POST /api/webhooks/whatsapp — Meta status/message events
// No JWT auth — Meta calls this endpoint directly.
// Signature validation is done inside the controller using X-Hub-Signature-256.
router.post('/whatsapp', handleWebhookEvent);

module.exports = router;
