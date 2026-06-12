const mongoose = require('mongoose');

const uploadHistorySchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  totalRows: {
    type: Number,
    default: 0
  },
  validRows: {
    type: Number,
    default: 0
  },
  duplicateRows: {
    type: Number,
    default: 0
  },
  parsingErrors: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Imported', 'Failed'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UploadHistory', uploadHistorySchema);
