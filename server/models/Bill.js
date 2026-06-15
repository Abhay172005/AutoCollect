const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  previousBalance: Number,
  newBalance: Number,
  changeAmount: Number
});

const billSchema = new mongoose.Schema({
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
  billNumber: {
    type: String,
    required: [true, 'Bill number is required'],
    unique: true,
    trim: true
  },
  billDate: {
    type: Date,
    required: [true, 'Bill date is required']
  },
  creditDays: {
    type: Number,
    default: 30
  },
  dueDate: {
    type: Date
  },
  days: {
    type: Number,
    default: 0
  },
  billAmount: {
    type: Number,
    required: [true, 'Bill amount is required'],
    default: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  cumulativeAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Due Today', 'Overdue', 'Paid', 'Partially Paid'],
    default: 'Upcoming'
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  lastReminderDate: {
    type: Date
  },
  paymentHistory: [paymentHistorySchema],
  uploadBatch: {
    type: String
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calculate due date and status before saving
billSchema.pre('save', function (next) {
  // Calculate due date
  if (this.billDate && this.creditDays != null) {
    const dueDate = new Date(this.billDate);
    dueDate.setDate(dueDate.getDate() + this.creditDays);
    this.dueDate = dueDate;
  }

  // Auto-calculate status if not Paid or Partially Paid
  if (this.balanceAmount <= 0) {
    this.status = 'Paid';
  } else if (this.balanceAmount < this.billAmount) {
    this.status = 'Partially Paid';
  } else if (this.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(this.dueDate);
    due.setHours(0, 0, 0, 0);

    if (due.getTime() === today.getTime()) {
      this.status = 'Due Today';
    } else if (due < today) {
      this.status = 'Overdue';
    } else {
      this.status = 'Upcoming';
    }
  }

  next();
});

// Index for search and filtering
billSchema.index({ partyName: 'text', billNumber: 'text' });
billSchema.index({ status: 1 });
billSchema.index({ dueDate: 1 });
billSchema.index({ billNumber: 1 });

module.exports = mongoose.model('Bill', billSchema);
