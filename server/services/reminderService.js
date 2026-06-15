const ReminderHistory = require('../models/ReminderHistory');
const Bill = require('../models/Bill');
const Party = require('../models/Party');
const Settings = require('../models/Settings');
const twilio = require('twilio');

/**
 * Generate reminder message using template
 */
const generateReminderMessage = async (bill, merchantId) => {
  let settings = await Settings.findOne({ merchantId });
  if (!settings) {
    settings = await Settings.create({ merchantId });
  }

  let template = settings.defaultReminderTemplate;
  const message = template
    .replace(/{partyName}/g, bill.partyName)
    .replace(/{balanceAmount}/g, bill.balanceAmount.toLocaleString('en-IN'))
    .replace(/{billNumber}/g, bill.billNumber)
    .replace(/{businessName}/g, settings.businessName)
    .replace(/{dueDate}/g, bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN') : 'N/A')
    .replace(/{billAmount}/g, bill.billAmount.toLocaleString('en-IN'));

  return message;
};

/**
 * Simulate sending a reminder (WhatsApp/SMS)
 * In production, this would integrate with Twilio/WhatsApp Business API
 */
const sendReminder = async (billId, reminderType = 'WhatsApp', merchantId) => {
  const bill = await Bill.findOne({ _id: billId, merchantId });
  if (!bill) throw new Error('Bill not found');

  const party = await Party.findOne({ merchantId, partyName: bill.partyName });
  const phoneNumber = party?.phoneNumber || '';

  const message = await generateReminderMessage(bill, merchantId);

  let isSuccess = false;
  let errorMessage = '';

  try {
    if (!phoneNumber) {
      throw new Error('Phone number is missing for this party');
    }

    // Normalize phone number
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // Convert internally to standard E.164
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    
    formattedPhone = '+' + formattedPhone;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !twilioNumber) {
        throw new Error('Twilio credentials are not configured in .env');
    }

    const client = twilio(accountSid, authToken);

    let fromNumber = twilioNumber;
    if (!fromNumber.startsWith('whatsapp:')) {
      fromNumber = `whatsapp:${fromNumber}`;
    }

    await client.messages.create({
        from: fromNumber,
        to: `whatsapp:${formattedPhone}`,
        body: message
    });
    
    isSuccess = true;
  } catch (err) {
    isSuccess = false;
    errorMessage = err.message || 'Unknown Error';
    console.error('Twilio Error:', err);
  }

  const reminder = await ReminderHistory.create({
    merchantId,
    billId: bill._id,
    billNumber: bill.billNumber,
    partyName: bill.partyName,
    phoneNumber,
    message,
    reminderType,
    status: isSuccess ? 'Sent' : 'Failed',
    errorDetails: errorMessage || undefined,
    sentAt: new Date()
  });

  // Update bill reminder status only if successful
  if (isSuccess) {
    bill.reminderSent = true;
    bill.lastReminderDate = new Date();
    await bill.save();
  }

  return {
    success: isSuccess,
    reminder,
    message: isSuccess
      ? `Reminder sent via ${reminderType} to ${bill.partyName}`
      : errorMessage
  };
};

/**
 * Send bulk reminders for multiple bills
 */
const sendBulkReminders = async (billIds, reminderType = 'WhatsApp', merchantId) => {
  const results = [];
  for (const billId of billIds) {
    try {
      const result = await sendReminder(billId, reminderType, merchantId);
      results.push(result);
    } catch (error) {
      results.push({ success: false, message: error.message });
    }
  }
  return results;
};

module.exports = { generateReminderMessage, sendReminder, sendBulkReminders };
