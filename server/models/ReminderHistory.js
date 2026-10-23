const mongoose = require('mongoose');

const reminderHistorySchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill'
  },
  billNumber: {
    type: String,
    required: true,
    trim: true
  },
  partyName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  reminderType: {
    type: String,
    enum: ['WhatsApp', 'SMS', 'Email'],
    default: 'WhatsApp'
  },

  // ── Status Lifecycle ──────────────────────────────────────────────────────
  // 'Accepted'  — Meta Cloud API accepted the reminder for delivery (HTTP 200 with wamid);
  //               Meta webhook 'sent' also maps to 'Accepted' (server queue/dispatch).
  //               API acceptance indicates submission and is distinct from confirmed delivery.
  // 'Delivered' — Webhook confirmed message reached recipient handset (sets deliveredAt).
  // 'Read'      — Webhook confirmed message was opened by recipient (sets readAt).
  // 'Failed'    — API rejection or webhook delivery failure (sets failedAt + metaError).
  //
  // Legacy / compatibility statuses:
  // 'Sent'      — Retained for historical pre-migration records sent via former provider.
  // 'Pending'   — Retained for any future asynchronous queueing flows.
  status: {
    type: String,
    enum: ['Sent', 'Accepted', 'Pending', 'Delivered', 'Read', 'Failed'],
    default: 'Pending'
  },

  errorDetails: {
    type: String
  },

  // ── Meta Cloud API fields ─────────────────────────────────────────────────
  // wamid: Meta message ID returned on acceptance (e.g. "wamid.xxx...")
  wamid: {
    type: String,
    sparse: true,   // allow multiple documents without wamid (null/undefined)
    index: true     // enables O(1) lookup by wamid for webhook updates
  },
  // metaError: JSON-serialised error detail from Meta API response
  metaError: {
    type: String
  },
  // Delivery / read timestamps populated by webhook events
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },

  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

reminderHistorySchema.index({ merchantId: 1, partyName: 'text', billNumber: 'text' });
reminderHistorySchema.index({ merchantId: 1, sentAt: -1 });

module.exports = mongoose.model('ReminderHistory', reminderHistorySchema);
