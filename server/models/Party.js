const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  partyName: {
    type: String,
    required: [true, 'Party name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

partySchema.virtual('hasPhoneNumber').get(function () {
  return !!this.phoneNumber && this.phoneNumber.length > 0;
});

// Index for search and multi-tenancy
partySchema.index({ merchantId: 1, partyName: 'text', city: 'text' });
partySchema.index({ merchantId: 1, partyName: 1 }, { unique: true });

module.exports = mongoose.model('Party', partySchema);
