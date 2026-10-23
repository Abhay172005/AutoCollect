'use strict';

const crypto = require('crypto');
const ReminderHistory = require('../models/ReminderHistory');

// ─────────────────────────────────────────────
//  GET /api/webhooks/whatsapp
//  Meta webhook verification
// ─────────────────────────────────────────────

/**
 * Meta calls this endpoint to verify the webhook subscription.
 * We validate the mode and the verify token before echoing the challenge.
 */
exports.verifyWebhook = (req, res) => {
  const mode        = req.query['hub.mode'];
  const token       = req.query['hub.verify_token'];
  const challenge   = req.query['hub.challenge'];

  if (!mode || !token) {
    return res.status(400).send('Missing hub.mode or hub.verify_token');
  }

  if (mode !== 'subscribe') {
    return res.status(403).send('Invalid hub.mode');
  }

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expectedToken) {
    console.error('[webhook] WHATSAPP_VERIFY_TOKEN is not configured');
    return res.status(500).send('Webhook not configured');
  }

  // Timing-safe comparison to prevent timing attacks
  const tokenBuf    = Buffer.from(token);
  const expectedBuf = Buffer.from(expectedToken);

  if (
    tokenBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(tokenBuf, expectedBuf)
  ) {
    return res.status(403).send('Verification token mismatch');
  }

  // Return only the challenge — no extra data
  return res.status(200).send(challenge);
};

// ─────────────────────────────────────────────
//  POST /api/webhooks/whatsapp
//  Meta webhook event handler
// ─────────────────────────────────────────────

/**
 * Validate X-Hub-Signature-256 and process incoming status updates.
 * Raw body must be captured BEFORE any JSON parsing — see server.js.
 */
exports.handleWebhookEvent = async (req, res) => {
  // ── 1. Signature validation ───────────────────────────────────────────────
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error('[webhook] META_APP_SECRET is not configured');
    // Return 200 to prevent Meta from retrying indefinitely during setup,
    // but log the configuration gap.
    return res.sendStatus(200);
  }

  const sigHeader = req.headers['x-hub-signature-256'];
  if (!sigHeader) {
    return res.status(403).json({ error: 'Missing X-Hub-Signature-256 header' });
  }

  const rawBody = req.rawBody; // populated by express.raw() in server.js
  if (!rawBody) {
    return res.status(400).json({ error: 'Raw body not available for signature check' });
  }

  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const sigBuf      = Buffer.from(sigHeader);
  const expectedBuf = Buffer.from(expectedSig);

  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // ── 2. Parse payload ──────────────────────────────────────────────────────
  // Acknowledge immediately so Meta doesn't time out waiting
  res.sendStatus(200);

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!body || body.object !== 'whatsapp_business_account') return;

    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const value    = change.value || {};
        const statuses = value.statuses || [];

        for (const statusObj of statuses) {
          await processStatusUpdate(statusObj).catch(err => {
            // Never throw from webhook handler — just log
            console.error('[webhook] processStatusUpdate error:', err.message);
          });
        }
      }
    }
  } catch (parseErr) {
    console.error('[webhook] Failed to parse webhook payload:', parseErr.message);
  }
};

// ─────────────────────────────────────────────
//  Internal: process a single status object
// ─────────────────────────────────────────────

/**
 * Map a Meta status event to a ReminderHistory update.
 * Handles duplicates idempotently (re-applying the same status is a no-op).
 *
 * @param {{ id: string, status: string, timestamp: string }} statusObj
 */
const processStatusUpdate = async (statusObj) => {
  const { id: wamid, status, timestamp } = statusObj || {};

  if (!wamid || !status) return;

  // Map Meta statuses to our schema values
  const statusMap = {
    sent:      'Accepted',  // Meta accepted & queued for delivery
    delivered: 'Delivered',
    read:      'Read',
    failed:    'Failed'
  };

  const mapped = statusMap[status];
  if (!mapped) return; // unknown status — ignore

  const ts = timestamp ? new Date(parseInt(timestamp, 10) * 1000) : new Date();

  const update = { status: mapped };
  if (mapped === 'Delivered') update.deliveredAt = ts;
  if (mapped === 'Read')      update.readAt      = ts;
  if (mapped === 'Failed')    update.failedAt    = ts;

  // Include errors from the webhook payload if present
  if (statusObj.errors && statusObj.errors.length > 0) {
    update.metaError = JSON.stringify(statusObj.errors);
  }

  // Idempotent update — only advance status (don't downgrade Read → Delivered, etc.)
  const record = await ReminderHistory.findOne({ wamid });
  if (!record) {
    // Message may have been sent before wamid tracking was deployed
    return;
  }

  // Status advancement order: Accepted < Delivered < Read > Failed
  const order = ['Accepted', 'Pending', 'Sent', 'Failed', 'Delivered', 'Read'];
  const currentIdx = order.indexOf(record.status);
  const newIdx     = order.indexOf(mapped);

  // Allow Failed at any point; otherwise only advance
  if (mapped !== 'Failed' && currentIdx >= newIdx) {
    return; // Already at or past this status — idempotent skip
  }

  await ReminderHistory.updateOne({ wamid }, { $set: update });
};
