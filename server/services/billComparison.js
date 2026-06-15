const Bill = require('../models/Bill');

/**
 * Core Weekly Comparison Engine
 * Compares newly extracted PDF data with existing bills in the database.
 * 
 * Logic:
 * - Match by billNumber
 * - If balance decreased → Partially Paid + payment history
 * - If balance is 0 → Paid + payment history
 * - If balance unchanged → Recalculate status based on due date
 * - If bill is new → Insert
 */
const compareBills = async (extractedBills, uploadBatch, merchantId) => {
  const results = {
    new: 0,
    updated: 0,
    paid: 0,
    partiallyPaid: 0,
    unchanged: 0,
    errors: [],
    details: []
  };

  for (const extracted of extractedBills) {
    try {
      const existingBill = await Bill.findOne({ merchantId, billNumber: extracted.billNumber });

      if (existingBill) {
        const previousBalance = existingBill.balanceAmount;
        const newBalance = extracted.balanceAmount;

        if (newBalance <= 0) {
          // Fully paid
          existingBill.balanceAmount = 0;
          existingBill.status = 'Paid';
          existingBill.paymentHistory.push({
            date: new Date(),
            previousBalance,
            newBalance: 0,
            changeAmount: previousBalance
          });
          results.paid++;
          results.details.push({
            billNumber: extracted.billNumber,
            partyName: extracted.partyName,
            action: 'Paid',
            previousBalance,
            newBalance: 0
          });
        } else if (newBalance < previousBalance) {
          // Partially paid
          existingBill.balanceAmount = newBalance;
          existingBill.status = 'Partially Paid';
          existingBill.paymentHistory.push({
            date: new Date(),
            previousBalance,
            newBalance,
            changeAmount: previousBalance - newBalance
          });
          results.partiallyPaid++;
          results.details.push({
            billNumber: extracted.billNumber,
            partyName: extracted.partyName,
            action: 'Partially Paid',
            previousBalance,
            newBalance
          });
        } else {
          // Unchanged – recalculate status based on due date
          results.unchanged++;
          results.details.push({
            billNumber: extracted.billNumber,
            partyName: extracted.partyName,
            action: 'Unchanged',
            previousBalance,
            newBalance
          });
        }

        // Update other fields
        existingBill.cumulativeAmount = extracted.cumulativeAmount;
        existingBill.days = extracted.days;
        existingBill.uploadBatch = uploadBatch;

        await existingBill.save(); // pre-save hook recalculates status for non-paid
        results.updated++;
      } else {
        // New bill – insert
        const newBill = new Bill({
          merchantId,
          partyName: extracted.partyName,
          billNumber: extracted.billNumber,
          billDate: extracted.billDate,
          creditDays: extracted.creditDays,
          days: extracted.days,
          billAmount: extracted.billAmount,
          balanceAmount: extracted.balanceAmount,
          cumulativeAmount: extracted.cumulativeAmount,
          uploadBatch
        });

        await newBill.save();
        results.new++;
        results.details.push({
          billNumber: extracted.billNumber,
          partyName: extracted.partyName,
          action: 'New',
          previousBalance: null,
          newBalance: extracted.balanceAmount
        });
      }
    } catch (error) {
      results.errors.push({
        billNumber: extracted.billNumber,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Auto-create parties from extracted bill data if they don't exist
 */
const syncParties = async (extractedBills, merchantId) => {
  const Party = require('../models/Party');
  const uniqueParties = [...new Set(extractedBills.map(b => b.partyName))];
  const newParties = [];
  const missingPhone = [];

  for (const partyName of uniqueParties) {
    if (!partyName || partyName === 'Unknown') continue;

    let party = await Party.findOne({ merchantId, partyName });
    if (!party) {
      const billData = extractedBills.find(b => b.partyName === partyName);
      party = await Party.create({
        merchantId,
        partyName,
        city: billData?.city || '',
        phoneNumber: '+918769744939' // Hardcoded for POC demo
      });
      newParties.push(partyName);
    } else if (!party.phoneNumber) {
      party.phoneNumber = '+918769744939';
      await party.save();
    }
  }

  return { newParties, missingPhone };
};

module.exports = { compareBills, syncParties };
