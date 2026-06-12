const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  merchantName: {
    type: String,
    default: 'Admin'
  },
  businessName: {
    type: String,
    default: 'Amar Steel Industries'
  },
  defaultReminderTemplate: {
    type: String,
    default: 'Dear {partyName},\n\nYour payment of ₹{balanceAmount} for Invoice {billNumber} is due.\n\nKindly arrange payment.\n\nRegards,\n{businessName}'
  },
  defaultCreditDays: {
    type: Number,
    default: 30
  },
  adminEmail: {
    type: String,
    default: 'admin@autocollect.com'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
