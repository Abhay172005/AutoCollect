const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Party = require('./models/Party');
const Bill = require('./models/Bill');
const ReminderHistory = require('./models/ReminderHistory');
const UploadHistory = require('./models/UploadHistory');

const cleanData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Cleaning up hardcoded/mock data...');
    
    await Party.deleteMany({});
    console.log('✅ Parties cleared');
    
    await Bill.deleteMany({});
    console.log('✅ Bills cleared');
    
    await ReminderHistory.deleteMany({});
    console.log('✅ Reminder History cleared');
    
    await UploadHistory.deleteMany({});
    console.log('✅ Upload History cleared');

    console.log('\n🎉 Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    process.exit(1);
  }
};

cleanData();
