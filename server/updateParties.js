const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Party = require('./models/Party');

const updateParties = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await Party.updateMany({}, { phoneNumber: '+918769744939' });
    console.log(`Updated ${result.modifiedCount} parties with the demo phone number.`);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

updateParties();
