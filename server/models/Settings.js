const mongoose = require('mongoose');

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
    default: 'Dear {partyName},\n\nYour payment of ₹{balanceAmount} for Invoice {billNumber} is due.\n\nKindly arrange payment.\n\nRegards,\n{businessName}'
  },
  defaultCreditDays: {
    type: Number,
    default: 30
  },
  adminEmail: {
    type: String
  },
  // Future WhatsApp Business API Integration Placeholder
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
