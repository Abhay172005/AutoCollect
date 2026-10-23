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

  // ── Status ────────────────────────────────────────────────────────────────
  // 'Sent' is kept for backward-compatibility with pre-migration records.
  // New records use 'Accepted' (Meta accepted the send request),
  // 'Delivered', 'Read', and 'Failed'.
  // 'Pending' is retained for any future queued-send flows.
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
