'use strict';

const ReminderHistory = require('../models/ReminderHistory');
const Bill = require('../models/Bill');
const Party = require('../models/Party');
const Settings = require('../models/Settings');

// ─────────────────────────────────────────────
//  Phone number normalisation (India-first)
// ─────────────────────────────────────────────

/**
 * Normalise a phone number to E.164 format (+91XXXXXXXXXX).
 * Returns null if the number cannot be made valid.
 * @param {string} raw
 * @returns {string|null}
 */
const normalisePhone = (raw) => {
  if (!raw || typeof raw !== 'string') return null;

  // Strip everything except digits and a leading +
  let digits = raw.replace(/[^\d+]/g, '');

  // Remove leading +
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  // 10-digit Indian number → prepend country code 91
  if (/^\d{10}$/.test(digits)) {
    digits = '91' + digits;
  }

  // 12-digit number starting with 91 → valid Indian E.164
  if (/^91\d{10}$/.test(digits)) {
    return '+' + digits;
  }

  // Already an international number of 7–15 digits
  if (/^\d{7,15}$/.test(digits)) {
    return '+' + digits;
  }

  return null;
};

// ─────────────────────────────────────────────
//  Meta Cloud API configuration check
// ─────────────────────────────────────────────

/**
 * Returns the validated Meta API config or throws a descriptive error.
 * Never logs credential values.
 */
const getMetaConfig = () => {
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion    = process.env.WHATSAPP_API_VERSION   || 'v26.0';
  const templateName  = process.env.WHATSAPP_TEMPLATE_NAME;
  const templateLang  = process.env.WHATSAPP_TEMPLATE_LANGUAGE;
  const sendEnabled   = process.env.WHATSAPP_SEND_ENABLED === 'true';

  const missing = [];
  if (!accessToken)   missing.push('WHATSAPP_ACCESS_TOKEN');
  if (!phoneNumberId) missing.push('WHATSAPP_PHONE_NUMBER_ID');
  if (!templateName)  missing.push('WHATSAPP_TEMPLATE_NAME');
  if (!templateLang)  missing.push('WHATSAPP_TEMPLATE_LANGUAGE');

  if (missing.length > 0) {
    throw new Error(
      `Meta WhatsApp configuration incomplete. Missing: ${missing.join(', ')}`
    );
  }

  return { accessToken, phoneNumberId, apiVersion, templateName, templateLang, sendEnabled };
};

// ─────────────────────────────────────────────
//  Meta Cloud API sender
// ─────────────────────────────────────────────

/**
 * Send a single WhatsApp template message via Meta Cloud API.
 *
 * Template: pending_bill_payment_reminder
 *   {{1}} → partyName
 *   {{2}} → billNumber
 *   {{3}} → balanceAmount (formatted)
 *   {{4}} → dueDate (formatted)
 *
 * @param {object} bill  — Mongoose Bill document
 * @param {string} toPhone — normalised E.164 phone number
 * @returns {{ wamid: string|null, error: string|null }}
 */
const sendMetaTemplateMessage = async (bill, toPhone) => {
  const config = getMetaConfig();

  if (!config.sendEnabled) {
    const err = new Error(
      'WhatsApp sending is disabled. Set WHATSAPP_SEND_ENABLED=true after the template is ' +
      'approved and production configuration is verified.'
    );
    err.code = 'SEND_DISABLED';
    throw err;
  }

  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

  const formattedAmount = typeof bill.balanceAmount === 'number'
    ? bill.balanceAmount.toLocaleString('en-IN')
    : String(bill.balanceAmount || '0');

  const formattedDate = bill.dueDate
    ? new Date(bill.dueDate).toLocaleDateString('en-IN')
    : 'N/A';

  const payload = {
    messaging_product: 'whatsapp',
    to: toPhone,
    type: 'template',
    template: {
      name: config.templateName,
      language: { code: config.templateLang },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: bill.partyName },
            { type: 'text', text: bill.billNumber },
            { type: 'text', text: formattedAmount },
            { type: 'text', text: formattedDate }
          ]
        }
      ]
    }
  };

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.accessToken}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000) // 15-second timeout
    });
  } catch (networkErr) {
    throw new Error(`Network error contacting Meta API: ${networkErr.message}`);
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Meta API returned non-JSON response (HTTP ${response.status})`);
  }

  if (!response.ok) {
    // Surface Meta's error detail without logging credentials
    const metaErr = body?.error;
    const msg = metaErr
      ? `Meta API error ${metaErr.code}: ${metaErr.message}` +
        (metaErr.error_data?.details ? ` — ${metaErr.error_data.details}` : '')
      : `Meta API HTTP ${response.status}`;
    const err = new Error(msg);
    err.metaError = metaErr || null;
    throw err;
  }

  // Successful acceptance — extract wamid
  const wamid = body?.messages?.[0]?.id || null;
  return { wamid };
};

// ─────────────────────────────────────────────
//  Preview message generator (local template)
// ─────────────────────────────────────────────

/**
 * Generate a human-readable preview using the merchant's editable template.
 * This is used only for UI preview — actual sends use the approved Meta template.
 */
const generateReminderMessage = async (bill, merchantId) => {
  let settings = await Settings.findOne({ merchantId });
  if (!settings) {
    settings = await Settings.create({ merchantId });
  }

  const template = settings.defaultReminderTemplate || '';
  return template
    .replace(/{partyName}/g,     bill.partyName)
    .replace(/{balanceAmount}/g, (bill.balanceAmount || 0).toLocaleString('en-IN'))
    .replace(/{billNumber}/g,    bill.billNumber)
    .replace(/{businessName}/g,  settings.businessName || '')
    .replace(/{dueDate}/g,       bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN') : 'N/A')
    .replace(/{billAmount}/g,    (bill.billAmount || 0).toLocaleString('en-IN'));
};

// ─────────────────────────────────────────────
//  Public: send single reminder
// ─────────────────────────────────────────────

/**
 * Send a WhatsApp reminder for a single bill.
 * Records outcome in ReminderHistory regardless of send result.
 * Only updates bill.reminderSent when Meta accepted the message.
 *
 * @param {string} billId
 * @param {string} reminderType
 * @param {string} merchantId
 */
const sendReminder = async (billId, reminderType = 'WhatsApp', merchantId) => {
  const bill = await Bill.findOne({ _id: billId, merchantId });
  if (!bill) throw new Error('Bill not found');

  const party = await Party.findOne({ merchantId, partyName: bill.partyName });
  const rawPhone = party?.phoneNumber || '';

  // Generate preview message for history log
  const previewMessage = await generateReminderMessage(bill, merchantId);

  let isSuccess    = false;
  let errorMessage = '';
  let wamid        = null;
  let metaError    = null;

  try {
    if (!rawPhone) {
      throw new Error('Phone number is missing for this party');
    }

    const normalised = normalisePhone(rawPhone);
    if (!normalised) {
      throw new Error(`Invalid phone number for party "${bill.partyName}": "${rawPhone}"`);
    }

    const result = await sendMetaTemplateMessage(bill, normalised);
    wamid     = result.wamid;
    isSuccess = true;
  } catch (err) {
    isSuccess    = false;
    errorMessage = err.message || 'Unknown error';
    metaError    = err.metaError || null;
    // Do not log the full error object to avoid leaking config info
    console.error('[reminderService] Send failed for bill', billId, ':', errorMessage);
  }

  // Persist outcome — always create a history record
  const reminder = await ReminderHistory.create({
    merchantId,
    billId:        bill._id,
    billNumber:    bill.billNumber,
    partyName:     bill.partyName,
    phoneNumber:   rawPhone,
    message:       previewMessage,
    reminderType,
    status:        isSuccess ? 'Accepted' : 'Failed',
    wamid:         wamid || undefined,
    errorDetails:  errorMessage || undefined,
    metaError:     metaError ? JSON.stringify(metaError) : undefined,
    sentAt:        new Date()
  });

  // Update bill only after Meta accepted the message
  if (isSuccess) {
    bill.reminderSent    = true;
    bill.lastReminderDate = new Date();
    await bill.save();
  }

  return {
    success: isSuccess,
    reminder,
    message: isSuccess
      ? `WhatsApp reminder accepted by Meta for ${bill.partyName}` +
        (wamid ? ` (wamid: ${wamid})` : '')
      : errorMessage
  };
};

// ─────────────────────────────────────────────
//  Public: send bulk reminders
// ─────────────────────────────────────────────

/**
 * Send reminders for multiple bills.
 * Returns an array of per-bill outcomes; partial failures are reported individually.
 *
 * @param {string[]} billIds
 * @param {string}   reminderType
 * @param {string}   merchantId
 */
const sendBulkReminders = async (billIds, reminderType = 'WhatsApp', merchantId) => {
  const results = [];
  for (const billId of billIds) {
    try {
      const result = await sendReminder(billId, reminderType, merchantId);
      results.push(result);
    } catch (error) {
      results.push({ success: false, message: error.message, billId });
    }
  }
  return results;
};

module.exports = {
  normalisePhone,
  getMetaConfig,
  generateReminderMessage,
  sendReminder,
  sendBulkReminders
};
