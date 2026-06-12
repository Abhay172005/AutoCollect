const mongoose = require('mongoose');

const reminderHistorySchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['Sent', 'Failed', 'Pending'],
    default: 'Sent'
  },
  errorDetails: {
    type: String
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

reminderHistorySchema.index({ partyName: 'text', billNumber: 'text' });
reminderHistorySchema.index({ sentAt: -1 });

module.exports = mongoose.model('ReminderHistory', reminderHistorySchema);
