const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  partyName: {
    type: String,
    required: [true, 'Party name is required'],
    unique: true,
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

// Index for search
partySchema.index({ partyName: 'text', city: 'text' });

module.exports = mongoose.model('Party', partySchema);
