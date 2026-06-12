const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/upload-history', require('./routes/uploadHistory'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/parties', require('./routes/parties'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));

// Global search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: { bills: [], parties: [] } });

    const Bill = require('./models/Bill');
    const Party = require('./models/Party');

    const [bills, parties] = await Promise.all([
      Bill.find({
        $or: [
          { partyName: { $regex: q, $options: 'i' } },
          { billNumber: { $regex: q, $options: 'i' } }
        ]
      }).limit(10),
      Party.find({
        $or: [
          { partyName: { $regex: q, $options: 'i' } },
          { phoneNumber: { $regex: q, $options: 'i' } },
          { city: { $regex: q, $options: 'i' } }
        ]
      }).limit(10)
    ]);

    res.json({ success: true, data: { bills, parties } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AutoCollect API is running', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AutoCollect API running on port ${PORT}`);
});

module.exports = app;
