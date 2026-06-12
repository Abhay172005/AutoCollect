const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('./models/User');
const Party = require('./models/Party');
const Bill = require('./models/Bill');
const Settings = require('./models/Settings');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed admin user
    const existingUser = await User.findOne({ email: 'admin@autocollect.com' });
    if (!existingUser) {
      await User.create({
        email: 'admin@autocollect.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Admin user created: admin@autocollect.com / admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Seed settings
    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({
        merchantName: 'Admin',
        businessName: 'Amar Steel Industries',
        defaultCreditDays: 30,
        adminEmail: 'admin@autocollect.com'
      });
      console.log('✅ Default settings created');
    }

    // Seed sample parties
    const sampleParties = [
      { partyName: 'Rajesh Steels', phoneNumber: '9876543210', city: 'Mumbai', email: 'rajesh@steels.com' },
      { partyName: 'Sharma Traders', phoneNumber: '9876543211', city: 'Delhi', email: 'sharma@traders.com' },
      { partyName: 'Patel Industries', phoneNumber: '9876543212', city: 'Ahmedabad', email: '' },
      { partyName: 'Gupta Enterprises', phoneNumber: '', city: 'Jaipur', email: '' },
      { partyName: 'Singh & Sons', phoneNumber: '9876543214', city: 'Ludhiana', email: 'singh@sons.com' },
      { partyName: 'Kumar Steel Corp', phoneNumber: '', city: 'Chennai', email: '' },
      { partyName: 'Agarwal Metals', phoneNumber: '9876543216', city: 'Kolkata', email: 'agarwal@metals.com' },
      { partyName: 'Jain Trading Co', phoneNumber: '9876543217', city: 'Pune', email: '' },
      { partyName: 'Mehta Hardware', phoneNumber: '', city: 'Surat', email: '' },
      { partyName: 'Verma Steel House', phoneNumber: '9876543219', city: 'Indore', email: 'verma@steelhouse.com' }
    ];

    for (const party of sampleParties) {
      const existing = await Party.findOne({ partyName: party.partyName });
      if (!existing) {
        await Party.create(party);
      }
    }
    console.log('✅ Sample parties seeded');

    // Seed sample bills
    const sampleBills = [
      { partyName: 'Rajesh Steels', billNumber: 'INV-2024-001', billDate: new Date('2024-11-15'), creditDays: 30, billAmount: 125000, balanceAmount: 125000, cumulativeAmount: 125000 },
      { partyName: 'Rajesh Steels', billNumber: 'INV-2024-002', billDate: new Date('2024-12-01'), creditDays: 30, billAmount: 87500, balanceAmount: 87500, cumulativeAmount: 212500 },
      { partyName: 'Sharma Traders', billNumber: 'INV-2024-003', billDate: new Date('2024-11-20'), creditDays: 45, billAmount: 230000, balanceAmount: 115000, cumulativeAmount: 115000 },
      { partyName: 'Patel Industries', billNumber: 'INV-2024-004', billDate: new Date('2024-12-10'), creditDays: 30, billAmount: 67000, balanceAmount: 67000, cumulativeAmount: 67000 },
      { partyName: 'Gupta Enterprises', billNumber: 'INV-2024-005', billDate: new Date('2024-10-25'), creditDays: 30, billAmount: 345000, balanceAmount: 345000, cumulativeAmount: 345000 },
      { partyName: 'Singh & Sons', billNumber: 'INV-2024-006', billDate: new Date('2024-12-05'), creditDays: 60, billAmount: 189000, balanceAmount: 189000, cumulativeAmount: 189000 },
      { partyName: 'Kumar Steel Corp', billNumber: 'INV-2024-007', billDate: new Date('2024-11-01'), creditDays: 30, billAmount: 95000, balanceAmount: 0, cumulativeAmount: 0 },
      { partyName: 'Agarwal Metals', billNumber: 'INV-2024-008', billDate: new Date('2024-12-15'), creditDays: 30, billAmount: 156000, balanceAmount: 156000, cumulativeAmount: 156000 },
      { partyName: 'Jain Trading Co', billNumber: 'INV-2024-009', billDate: new Date('2024-11-10'), creditDays: 45, billAmount: 78000, balanceAmount: 39000, cumulativeAmount: 39000 },
      { partyName: 'Mehta Hardware', billNumber: 'INV-2024-010', billDate: new Date('2024-12-20'), creditDays: 30, billAmount: 210000, balanceAmount: 210000, cumulativeAmount: 210000 },
      { partyName: 'Verma Steel House', billNumber: 'INV-2024-011', billDate: new Date('2024-10-15'), creditDays: 30, billAmount: 430000, balanceAmount: 430000, cumulativeAmount: 430000 },
      { partyName: 'Rajesh Steels', billNumber: 'INV-2024-012', billDate: new Date('2024-12-18'), creditDays: 30, billAmount: 55000, balanceAmount: 55000, cumulativeAmount: 267500 },
      { partyName: 'Sharma Traders', billNumber: 'INV-2024-013', billDate: new Date('2024-12-22'), creditDays: 30, billAmount: 178000, balanceAmount: 178000, cumulativeAmount: 293000 },
      { partyName: 'Patel Industries', billNumber: 'INV-2024-014', billDate: new Date('2024-11-28'), creditDays: 45, billAmount: 92000, balanceAmount: 46000, cumulativeAmount: 113000 },
      { partyName: 'Gupta Enterprises', billNumber: 'INV-2024-015', billDate: new Date('2024-12-01'), creditDays: 30, billAmount: 134000, balanceAmount: 134000, cumulativeAmount: 479000 }
    ];

    for (const bill of sampleBills) {
      const existing = await Bill.findOne({ billNumber: bill.billNumber });
      if (!existing) {
        await Bill.create(bill);
      }
    }
    console.log('✅ Sample bills seeded');

    console.log('\n🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedData();
