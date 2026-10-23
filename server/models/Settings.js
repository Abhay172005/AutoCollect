const mongoose = require('mongoose');

// The OLD default template (pre-Meta-migration). Used by settingsController
// to detect documents that still carry the original default and migrate them.
const OLD_DEFAULT_TEMPLATE =
  'Dear {partyName},\n\nYour payment of \u20b9{balanceAmount} for Invoice {billNumber} is due.\n\nKindly arrange payment.\n\nRegards,\n{businessName}';

// The current default template mirrors the approved Meta WhatsApp template body
// (pending_bill_payment_reminder) using local placeholder syntax for preview.
// The signature is fixed to "Amar Steel Industries" — do NOT replace with {businessName}.
const DEFAULT_REMINDER_TEMPLATE =
  'Dear {partyName},\n\n' +
  'This is a payment reminder regarding invoice {billNumber}.\n\n' +
  'Our records show an outstanding balance of \u20b9{balanceAmount}, due on {dueDate}.\n\n' +
  'If you have already made the payment, please disregard this message. ' +
  'If you have any questions about this invoice, please contact us at +91 9417204939.\n\n' +
  'Regards,\nAmar Steel Industries';

const settingsSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  merchantName: {
    type: String
  },
  businessName: {
    type: String
  },
  defaultReminderTemplate: {
    type: String,
    default: DEFAULT_REMINDER_TEMPLATE
  },
  defaultCreditDays: {
    type: Number,
    default: 30
  },
  adminEmail: {
    type: String
  },
  // Meta WhatsApp Business API fields (managed via env vars, not stored in DB)
  whatsappAccountId: {
    type: String
  },
  whatsappPhoneNumberId: {
    type: String
  },
  whatsappAccessToken: {
    type: String
  },
  whatsappStatus: {
    type: String,
    enum: ['Disconnected', 'Connected'],
    default: 'Disconnected'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
module.exports.OLD_DEFAULT_TEMPLATE = OLD_DEFAULT_TEMPLATE;
module.exports.DEFAULT_REMINDER_TEMPLATE = DEFAULT_REMINDER_TEMPLATE;
