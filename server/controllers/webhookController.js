'use strict';

const crypto = require('crypto');
const ReminderHistory = require('../models/ReminderHistory');

/**
 * Detect missing or recognizable placeholder secrets.
 * A real secret must be a non-empty string that does not match common placeholder patterns.
 * @param {string|undefined} secret
 * @returns {boolean}
 */
const isPlaceholderSecret = (secret) => {
  if (!secret || typeof secret !== 'string') return true;
  const trimmed = secret.trim();
  if (trimmed.length === 0) return true;
  if (/^(your_|replace_|change_|todo|placeholder|<|\*)/i.test(trimmed)) return true;
  if (['your_meta_app_secret', 'replace_with_a_random_secret_string', 'app_secret_here'].includes(trimmed.toLowerCase())) return true;
  return false;
};

// ─────────────────────────────────────────────
//  GET /api/webhooks/whatsapp
//  Meta webhook verification
// ─────────────────────────────────────────────

/**
 * Meta calls this endpoint to verify the webhook subscription.
 * We validate the mode and the verify token before echoing the challenge.
 */
const verifyWebhook = (req, res) => {
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
  if (isPlaceholderSecret(expectedToken)) {
    console.error('[webhook] WHATSAPP_VERIFY_TOKEN is not configured or contains a placeholder');
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
const handleWebhookEvent = async (req, res) => {
  // ── 1. Signature validation ───────────────────────────────────────────────
  const appSecret = process.env.META_APP_SECRET;
  if (isPlaceholderSecret(appSecret)) {
    console.error('[webhook] META_APP_SECRET is not configured or contains a placeholder');
    return res.status(500).json({ error: 'Webhook signature verification is not configured on server' });
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
 *
 * Status Mapping & Terminology:
 * - Meta 'sent' → 'Accepted': Meta server received and queued/dispatched the message.
 *   This represents API acceptance / queueing, distinct from handset delivery.
 * - Meta 'delivered' → 'Delivered': Message reached recipient handset (records deliveredAt).
 * - Meta 'read' → 'Read': Recipient opened the message (records readAt).
 * - Meta 'failed' → 'Failed': Message failed dispatch or delivery (records failedAt + metaError).
 *
 * State & Timestamp Resolution Policy:
 * 1. Provider Timestamps: Uses event timestamp (statusObj.timestamp in seconds) to evaluate
 *    event freshness and prevent stale out-of-order events from overwriting newer states.
 * 2. Idempotency: Duplicate events for the same status are no-ops, avoiding redundant writes.
 * 3. Read-before-Delivered: If a 'read' event arrives before 'delivered', status advances to 'Read'.
 *    When the delayed 'delivered' event arrives subsequently, 'deliveredAt' is backfilled without
 *    downgrading the 'Read' status.
 * 4. Stale Failure / Out-of-order: If a message is already confirmed 'Delivered' or 'Read',
 *    a delayed or stale 'failed' event is dropped.
 * 5. Recovery / Retry: If a message is recorded as 'Failed', but a subsequent 'delivered' or
 *    'read' event arrives with a newer provider timestamp than the recorded failure, the newer
 *    successful state is recorded.
 *
 * @param {{ id: string, status: string, timestamp: string, errors?: Array }} statusObj
 */
const processStatusUpdate = async (statusObj) => {
  const { id: wamid, status, timestamp } = statusObj || {};

  if (!wamid || !status) return;

  // Map Meta statuses to our schema values
  const statusMap = {
    sent:      'Accepted',  // Meta server dispatch / queueing (distinct from confirmed delivery)
    delivered: 'Delivered', // Handset delivery
    read:      'Read',      // User read receipt
    failed:    'Failed'     // Failure
  };

  const mapped = statusMap[status];
  if (!mapped) return; // unknown status — ignore

  const record = await ReminderHistory.findOne({ wamid });
  if (!record) {
    // Message may have been sent before wamid tracking was deployed
    return;
  }

  // Parse provider event timestamp
  const eventTime = timestamp ? parseInt(timestamp, 10) * 1000 : Date.now();
  const ts = new Date(eventTime);

  // 1. Idempotency: exact duplicate status
  if (record.status === mapped) {
    // If deliveredAt is missing on a duplicate Delivered event, backfill it
    if (mapped === 'Delivered' && !record.deliveredAt) {
      await ReminderHistory.updateOne({ wamid }, { $set: { deliveredAt: ts } });
    } else if (mapped === 'Read' && !record.readAt) {
      await ReminderHistory.updateOne({ wamid }, { $set: { readAt: ts } });
    }
    return; // No redundant status update
  }

  // 2. Message is in 'Read' status (confirmed customer read receipt):
  if (record.status === 'Read') {
    // Read-before-delivered: if delivered event arrives late, record deliveredAt without downgrading status.
    // If deliveredAt was missing or initialized to readAt, an earlier delivery timestamp corrects it.
    if (mapped === 'Delivered') {
      const currentDeliveredTime = record.deliveredAt ? record.deliveredAt.getTime() : null;
      if (!currentDeliveredTime || eventTime < currentDeliveredTime) {
        await ReminderHistory.updateOne({ wamid }, { $set: { deliveredAt: ts } });
      }
      return;
    }
    // Stale 'Accepted' or late 'Failed' must not overwrite confirmed Read state
    return;
  }

  // 3. Message is in 'Delivered' status (confirmed handset delivery):
  if (record.status === 'Delivered') {
    if (mapped === 'Read') {
      // Advance to Read
      const update = { status: 'Read', readAt: ts };
      await ReminderHistory.updateOne({ wamid }, { $set: update });
      return;
    }
    // Stale 'Accepted' or delayed 'Failed' must not downgrade or overwrite confirmed delivery
    return;
  }

  // 4. Message is in 'Failed' status:
  if (record.status === 'Failed') {
    // If a delivery/read event arrives with a provider timestamp NEWER than the failure,
    // the provider recovered or retried successfully — advance to the newer state.
    // Clear stale failure metadata so it does not contradict the new valid status.
    const failedTime = record.failedAt ? record.failedAt.getTime() : 0;
    if ((mapped === 'Delivered' || mapped === 'Read') && eventTime > failedTime) {
      const update = { status: mapped };
      if (mapped === 'Delivered') update.deliveredAt = ts;
      if (mapped === 'Read') {
        update.readAt = ts;
        if (!record.deliveredAt) update.deliveredAt = ts;
      }
      await ReminderHistory.updateOne(
        { wamid },
        {
          $set: update,
          $unset: { failedAt: 1, metaError: 1, errorDetails: 1 }
        }
      );
      return;
    }
    // Stale or duplicate events: ignore
    return;
  }

  // 5. Message is in 'Accepted', 'Pending', or legacy 'Sent':
  // Drop stale events older than initial record creation if timestamp provided
  const recordSentTime = record.sentAt ? record.sentAt.getTime() : 0;
  if (recordSentTime > 0 && eventTime < recordSentTime && mapped === 'Accepted') {
    return;
  }

  const update = { status: mapped };
  if (mapped === 'Delivered') update.deliveredAt = ts;
  if (mapped === 'Read') {
    update.readAt = ts;
    // If read arrives before delivered, also record deliveredAt as of this time
    if (!record.deliveredAt) update.deliveredAt = ts;
  }
  if (mapped === 'Failed') {
    update.failedAt = ts;
    if (statusObj.errors && statusObj.errors.length > 0) {
      update.metaError = JSON.stringify(statusObj.errors);
    }
  }

  const updateDoc = { $set: update };
  if (mapped === 'Delivered' || mapped === 'Read') {
    if (record.failedAt || record.metaError || record.errorDetails) {
      updateDoc.$unset = { failedAt: 1, metaError: 1, errorDetails: 1 };
    }
  }

  await ReminderHistory.updateOne({ wamid }, updateDoc);
};

module.exports = {
  isPlaceholderSecret,
  verifyWebhook,
  handleWebhookEvent,
  processStatusUpdate
};
