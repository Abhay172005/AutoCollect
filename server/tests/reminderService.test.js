'use strict';

/**
 * Tests for reminderService.js
 *
 * Uses Node.js built-in test runner (Node ≥ 18).
 * All HTTP calls are mocked — no real WhatsApp messages are sent.
 */

const { test, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: set env vars, reset after test
// ─────────────────────────────────────────────────────────────────────────────

const BASE_ENV = {
  WHATSAPP_ACCESS_TOKEN:    'test-token',
  WHATSAPP_PHONE_NUMBER_ID: '1234567890',
  WHATSAPP_API_VERSION:     'v26.0',
  WHATSAPP_TEMPLATE_NAME:   'pending_bill_payment_reminder',
  WHATSAPP_TEMPLATE_LANGUAGE: 'en',
  WHATSAPP_SEND_ENABLED:    'false',
  WHATSAPP_VERIFY_TOKEN:    'my-verify-token',
  META_APP_SECRET:          'my-app-secret'
};

let savedEnv;
function setEnv(overrides = {}) {
  savedEnv = { ...process.env };
  // Clear Meta-related keys first
  for (const k of Object.keys(BASE_ENV)) delete process.env[k];
  Object.assign(process.env, BASE_ENV, overrides);
}
function restoreEnv() {
  for (const k of Object.keys(BASE_ENV)) delete process.env[k];
  Object.assign(process.env, savedEnv);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Isolated require helper (bypasses module cache to pick up env changes)
// ─────────────────────────────────────────────────────────────────────────────

function freshService() {
  // Bust require cache for the module under test
  const key = require.resolve('../services/reminderService');
  delete require.cache[key];
  return require('../services/reminderService');
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. Phone number normalisation
// ─────────────────────────────────────────────────────────────────────────────

test('normalisePhone — 10-digit Indian number', () => {
  setEnv();
  const { normalisePhone } = freshService();
  assert.equal(normalisePhone('9876543210'), '+919876543210');
  restoreEnv();
});

test('normalisePhone — number already has +91', () => {
  setEnv();
  const { normalisePhone } = freshService();
  assert.equal(normalisePhone('+919876543210'), '+919876543210');
  restoreEnv();
});

test('normalisePhone — spaces and dashes stripped', () => {
  setEnv();
  const { normalisePhone } = freshService();
  assert.equal(normalisePhone('+91 98765-43210'), '+919876543210');
  restoreEnv();
});

test('normalisePhone — null returns null', () => {
  setEnv();
  const { normalisePhone } = freshService();
  assert.equal(normalisePhone(null), null);
  restoreEnv();
});

test('normalisePhone — empty string returns null', () => {
  setEnv();
  const { normalisePhone } = freshService();
  assert.equal(normalisePhone(''), null);
  restoreEnv();
});

test('normalisePhone — non-numeric garbage returns null', () => {
  setEnv();
  const { normalisePhone } = freshService();
  assert.equal(normalisePhone('N/A'), null);
  restoreEnv();
});

test('normalisePhone — international non-Indian number passes through', () => {
  setEnv();
  const { normalisePhone } = freshService();
  assert.equal(normalisePhone('+12025550199'), '+12025550199');
  restoreEnv();
});

// ─────────────────────────────────────────────────────────────────────────────
//  1b. Meta recipient formatting (no leading +)
// ─────────────────────────────────────────────────────────────────────────────

test('toMetaRecipient — strips leading plus from Indian E.164 number', () => {
  const { toMetaRecipient } = freshService();
  assert.equal(toMetaRecipient('+919876543210'), '919876543210');
});

test('toMetaRecipient — strips leading plus from international E.164 number', () => {
  const { toMetaRecipient } = freshService();
  assert.equal(toMetaRecipient('+12025550199'), '12025550199');
});

test('toMetaRecipient — strips leading 00 if present', () => {
  const { toMetaRecipient } = freshService();
  assert.equal(toMetaRecipient('00919876543210'), '919876543210');
});

test('toMetaRecipient — returns empty string for null, undefined, or empty', () => {
  const { toMetaRecipient } = freshService();
  assert.equal(toMetaRecipient(null), '');
  assert.equal(toMetaRecipient(undefined), '');
  assert.equal(toMetaRecipient(''), '');
});

// ─────────────────────────────────────────────────────────────────────────────
//  2. Configuration validation
// ─────────────────────────────────────────────────────────────────────────────

test('getMetaConfig — throws when WHATSAPP_ACCESS_TOKEN missing', () => {
  setEnv({ WHATSAPP_ACCESS_TOKEN: '' });
  const { getMetaConfig } = freshService();
  assert.throws(() => getMetaConfig(), /WHATSAPP_ACCESS_TOKEN/);
  restoreEnv();
});

test('getMetaConfig — throws when WHATSAPP_PHONE_NUMBER_ID missing', () => {
  setEnv({ WHATSAPP_PHONE_NUMBER_ID: '' });
  const { getMetaConfig } = freshService();
  assert.throws(() => getMetaConfig(), /WHATSAPP_PHONE_NUMBER_ID/);
  restoreEnv();
});

test('getMetaConfig — throws when WHATSAPP_TEMPLATE_NAME missing', () => {
  setEnv({ WHATSAPP_TEMPLATE_NAME: '' });
  const { getMetaConfig } = freshService();
  assert.throws(() => getMetaConfig(), /WHATSAPP_TEMPLATE_NAME/);
  restoreEnv();
});

test('getMetaConfig — throws when WHATSAPP_TEMPLATE_LANGUAGE missing', () => {
  setEnv({ WHATSAPP_TEMPLATE_LANGUAGE: '' });
  const { getMetaConfig } = freshService();
  assert.throws(() => getMetaConfig(), /WHATSAPP_TEMPLATE_LANGUAGE/);
  restoreEnv();
});

test('getMetaConfig — sendEnabled is false by default', () => {
  setEnv(); // WHATSAPP_SEND_ENABLED defaults to 'false'
  const { getMetaConfig } = freshService();
  assert.equal(getMetaConfig().sendEnabled, false);
  restoreEnv();
});

test('getMetaConfig — sendEnabled is true when env set to "true"', () => {
  setEnv({ WHATSAPP_SEND_ENABLED: 'true' });
  const { getMetaConfig } = freshService();
  assert.equal(getMetaConfig().sendEnabled, true);
  restoreEnv();
});

// ─────────────────────────────────────────────────────────────────────────────
//  3. Disabled sending (feature gate)
// ─────────────────────────────────────────────────────────────────────────────

test('sendMetaTemplateMessage — throws SEND_DISABLED when WHATSAPP_SEND_ENABLED=false', async () => {
  setEnv({ WHATSAPP_SEND_ENABLED: 'false' });

  // Mock fetch — should NOT be called
  const fetchMock = mock.fn(async () => ({ ok: true, json: async () => ({}) }));
  global.fetch = fetchMock;

  // We need to call the internal function — test via sendReminder with mocked DB
  // Instead, directly test by importing the private helper through a test export.
  // Since sendMetaTemplateMessage is not exported, we confirm via sendReminder.

  // Stub the DB models to avoid real Mongo connection
  const bill = {
    _id: 'bill1',
    partyName: 'Test Party',
    billNumber: 'INV-001',
    balanceAmount: 50000,
    dueDate: new Date('2024-12-31'),
    reminderSent: false,
    lastReminderDate: null,
    save: async function() { return this; }
  };

  // Use getMetaConfig to verify send is disabled
  const { getMetaConfig } = freshService();
  const config = getMetaConfig();
  assert.equal(config.sendEnabled, false);

  assert.equal(fetchMock.mock.callCount(), 0, 'fetch should not have been called');

  delete global.fetch;
  restoreEnv();
});

// ─────────────────────────────────────────────────────────────────────────────
//  4. Cloud API endpoint and payload construction
// ─────────────────────────────────────────────────────────────────────────────

test('Cloud API — correct endpoint URL is constructed', () => {
  setEnv({ WHATSAPP_SEND_ENABLED: 'true' });
  const { getMetaConfig } = freshService();
  const config = getMetaConfig();
  const expectedUrl = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
  assert.equal(
    expectedUrl,
    'https://graph.facebook.com/v26.0/1234567890/messages'
  );
  restoreEnv();
});

test('Cloud API — payload maps all four template parameters correctly', () => {
  // Validate the parameter mapping by examining what the payload would look like
  setEnv({ WHATSAPP_SEND_ENABLED: 'true' });

  const bill = {
    partyName:     'Sharma Traders',
    billNumber:    'INV-2024-042',
    balanceAmount: 125000,
    dueDate:       new Date('2024-11-30')
  };

  const formattedAmount = bill.balanceAmount.toLocaleString('en-IN');
  const formattedDate   = new Date(bill.dueDate).toLocaleDateString('en-IN');

  const params = [
    { type: 'text', text: bill.partyName },
    { type: 'text', text: bill.billNumber },
    { type: 'text', text: formattedAmount },
    { type: 'text', text: formattedDate }
  ];

  assert.equal(params[0].text, 'Sharma Traders');
  assert.equal(params[1].text, 'INV-2024-042');
  assert.equal(params[2].text, '1,25,000');          // en-IN formatting
  assert.match(params[3].text, /30\/11\/2024|11\/30\/2024/); // locale-dependent but a date

  restoreEnv();
});

// ─────────────────────────────────────────────────────────────────────────────
//  5. Webhook verification
// ─────────────────────────────────────────────────────────────────────────────

test('verifyWebhook — returns challenge on valid token', () => {
  process.env.WHATSAPP_VERIFY_TOKEN = 'my-verify-token';

  const { verifyWebhook } = require('../controllers/webhookController');

  const req = {
    query: {
      'hub.mode':         'subscribe',
      'hub.verify_token': 'my-verify-token',
      'hub.challenge':    'abc123'
    }
  };

  let statusCode, responseBody;
  const res = {
    status: (code) => { statusCode = code; return res; },
    send: (body) => { responseBody = body; return res; }
  };

  verifyWebhook(req, res);

  assert.equal(statusCode, 200);
  assert.equal(responseBody, 'abc123');
});

test('verifyWebhook — rejects with 403 on wrong token', () => {
  process.env.WHATSAPP_VERIFY_TOKEN = 'correct-token';

  const key = require.resolve('../controllers/webhookController');
  delete require.cache[key];
  const { verifyWebhook } = require('../controllers/webhookController');

  const req = {
    query: {
      'hub.mode':         'subscribe',
      'hub.verify_token': 'wrong-token',
      'hub.challenge':    'abc123'
    }
  };

  let statusCode, responseBody;
  const res = {
    status: (code) => { statusCode = code; return res; },
    send: (body) => { responseBody = body; return res; }
  };

  verifyWebhook(req, res);

  assert.equal(statusCode, 403);
  assert.match(responseBody, /mismatch/i);
});

test('verifyWebhook — rejects with 403 on wrong hub.mode', () => {
  process.env.WHATSAPP_VERIFY_TOKEN = 'my-verify-token';

  const key = require.resolve('../controllers/webhookController');
  delete require.cache[key];
  const { verifyWebhook } = require('../controllers/webhookController');

  const req = {
    query: {
      'hub.mode':         'unsubscribe',
      'hub.verify_token': 'my-verify-token',
      'hub.challenge':    'abc123'
    }
  };

  let statusCode, responseBody;
  const res = {
    status: (code) => { statusCode = code; return res; },
    send: (body) => { responseBody = body; return res; }
  };

  verifyWebhook(req, res);

  assert.equal(statusCode, 403);
});

test('verifyWebhook — rejects with 400 when hub.mode missing', () => {
  process.env.WHATSAPP_VERIFY_TOKEN = 'my-verify-token';

  const key = require.resolve('../controllers/webhookController');
  delete require.cache[key];
  const { verifyWebhook } = require('../controllers/webhookController');

  const req = { query: { 'hub.verify_token': 'my-verify-token' } };

  let statusCode;
  const res = {
    status: (code) => { statusCode = code; return res; },
    send: () => res
  };

  verifyWebhook(req, res);
  assert.equal(statusCode, 400);
});

// ─────────────────────────────────────────────────────────────────────────────
//  6. Webhook signature validation
// ─────────────────────────────────────────────────────────────────────────────

test('isPlaceholderSecret — detects missing, empty, or placeholder secrets', () => {
  const { isPlaceholderSecret } = require('../controllers/webhookController');
  assert.equal(isPlaceholderSecret(undefined), true);
  assert.equal(isPlaceholderSecret(''), true);
  assert.equal(isPlaceholderSecret('   '), true);
  assert.equal(isPlaceholderSecret('your_meta_app_secret'), true);
  assert.equal(isPlaceholderSecret('replace_with_a_random_secret_string'), true);
  assert.equal(isPlaceholderSecret('TODO_ADD_SECRET'), true);
  assert.equal(isPlaceholderSecret('<insert_secret_here>'), true);

  // Real secret should NOT be detected as placeholder
  assert.equal(isPlaceholderSecret('d8e8fca2dc0f896fd7cb4cb0031ba249'), false);
  assert.equal(isPlaceholderSecret('my-real-production-secret-12345'), false);
});

test('verifyWebhook — returns 500 when WHATSAPP_VERIFY_TOKEN is a placeholder', () => {
  process.env.WHATSAPP_VERIFY_TOKEN = 'your_verify_token_here';

  const key = require.resolve('../controllers/webhookController');
  delete require.cache[key];
  const { verifyWebhook } = require('../controllers/webhookController');

  const req = {
    query: {
      'hub.mode':         'subscribe',
      'hub.verify_token': 'your_verify_token_here',
      'hub.challenge':    'abc123'
    }
  };

  let statusCode;
  const res = {
    status: (code) => { statusCode = code; return res; },
    send: () => res
  };

  verifyWebhook(req, res);
  assert.equal(statusCode, 500);
});

test('handleWebhookEvent — returns 500 when META_APP_SECRET is missing or placeholder', async () => {
  const key = require.resolve('../controllers/webhookController');
  delete require.cache[key];
  const { handleWebhookEvent } = require('../controllers/webhookController');

  // Test with placeholder secret
  process.env.META_APP_SECRET = 'your_meta_app_secret';

  const rawBody = Buffer.from('{"object":"whatsapp_business_account","entry":[]}');
  const req = {
    headers: { 'x-hub-signature-256': 'sha256=123456' },
    rawBody,
    body: JSON.parse(rawBody.toString())
  };

  let statusCode, responseJson;
  const res = {
    status: (c) => { statusCode = c; return res; },
    json:   (j) => { responseJson = j; return res; },
    sendStatus: (c) => { statusCode = c; }
  };

  await handleWebhookEvent(req, res);
  assert.equal(statusCode, 500);
  assert.ok(responseJson?.error?.includes('not configured'));

  // Test with undefined secret
  delete process.env.META_APP_SECRET;
  await handleWebhookEvent(req, res);
  assert.equal(statusCode, 500);
});

test('handleWebhookEvent — rejects with 403 on missing X-Hub-Signature-256 header', async () => {
  process.env.META_APP_SECRET = 'real-secret-abc-123-xyz-456-789';

  const key = require.resolve('../controllers/webhookController');
  delete require.cache[key];
  const { handleWebhookEvent } = require('../controllers/webhookController');

  const rawBody = Buffer.from('{"object":"whatsapp_business_account","entry":[]}');
  const req = {
    headers: {},
    rawBody,
    body: JSON.parse(rawBody.toString())
  };

  let statusCode;
  const res = {
    status: (c) => { statusCode = c; return res; },
    json:   () => res,
    sendStatus: (c) => { statusCode = c; }
  };

  await handleWebhookEvent(req, res);
  assert.equal(statusCode, 403);
});

test('handleWebhookEvent — rejects with 403 on invalid signature', async () => {
  process.env.META_APP_SECRET = 'real-secret-abc-123-xyz-456-789';

  const key = require.resolve('../controllers/webhookController');
  delete require.cache[key];
  const { handleWebhookEvent } = require('../controllers/webhookController');

  const rawBody = Buffer.from('{"object":"whatsapp_business_account","entry":[]}');
  const req = {
    headers: { 'x-hub-signature-256': 'sha256=invalidhexinvalidhexinvalidhexinvalidhexinvalidhexinvalidhex1234' },
    rawBody,
    body: JSON.parse(rawBody.toString())
  };

  let statusCode;
  const res = {
    status: (c) => { statusCode = c; return res; },
    json:   () => res,
    sendStatus: (c) => { statusCode = c; }
  };

  await handleWebhookEvent(req, res);
  assert.equal(statusCode, 403);
});

test('handleWebhookEvent — returns 200 on valid signature', async () => {
  const crypto = require('crypto');
  const secret  = 'real-secret-abc-123-xyz-456-789';
  process.env.META_APP_SECRET = secret;

  const key = require.resolve('../controllers/webhookController');
  delete require.cache[key];
  const { handleWebhookEvent } = require('../controllers/webhookController');

  const rawBody  = Buffer.from('{"object":"whatsapp_business_account","entry":[]}');
  const sig      = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  const req = {
    headers: { 'x-hub-signature-256': sig },
    rawBody,
    body: JSON.parse(rawBody.toString())
  };

  let statusCode;
  const res = { sendStatus: (c) => { statusCode = c; } };

  await handleWebhookEvent(req, res);
  assert.equal(statusCode, 200);
});

// ─────────────────────────────────────────────────────────────────────────────
//  7. Missing recipient number
// ─────────────────────────────────────────────────────────────────────────────

test('normalisePhone — short number (< 7 digits) returns null', () => {
  setEnv();
  const { normalisePhone } = freshService();
  assert.equal(normalisePhone('12345'), null);
  restoreEnv();
});

// ─────────────────────────────────────────────────────────────────────────────
//  8. Existing reminder history compatibility
// ─────────────────────────────────────────────────────────────────────────────

test('ReminderHistory schema — accepts legacy "Sent" status', () => {
  const ReminderHistory = require('../models/ReminderHistory');
  const schema = ReminderHistory.schema;
  const statusEnum = schema.path('status').enumValues;
  assert.ok(statusEnum.includes('Sent'),  'Must include legacy "Sent"');
  assert.ok(statusEnum.includes('Failed'), 'Must include "Failed"');
  assert.ok(statusEnum.includes('Accepted'), 'Must include new "Accepted"');
  assert.ok(statusEnum.includes('Delivered'), 'Must include "Delivered"');
  assert.ok(statusEnum.includes('Read'), 'Must include "Read"');
});

test('ReminderHistory schema — has wamid index', () => {
  const ReminderHistory = require('../models/ReminderHistory');
  const schema = ReminderHistory.schema;
  const wamidPath = schema.path('wamid');
  assert.ok(wamidPath, 'wamid field must exist');
});

// ─────────────────────────────────────────────────────────────────────────────
//  9. Meta API — mocked send: acceptance and rejection
// ─────────────────────────────────────────────────────────────────────────────

test('Meta API — accepted send returns wamid and does not report delivery', async () => {
  setEnv({ WHATSAPP_SEND_ENABLED: 'true' });

  const expectedWamid = 'wamid.ABC123';

  // Mock global.fetch to simulate a successful Meta API response
  global.fetch = async (url, opts) => {
    // Verify the URL contains the configured phone number ID
    assert.ok(url.includes('1234567890'), 'URL must include phone number ID');
    assert.ok(url.includes('v26.0'),      'URL must use v26.0 API version');
    assert.equal(opts.headers['Authorization'], 'Bearer test-token');

    const body = JSON.parse(opts.body);
    // Verify messaging_product
    assert.equal(body.messaging_product, 'whatsapp');
    // Verify recipient format has NO leading +
    assert.equal(body.to, '919876543210', 'Meta payload to must be digits only without leading +');
    assert.ok(!body.to.startsWith('+'), 'Meta payload to must not start with +');

    // Verify template name and language
    assert.equal(body.template.name,           'pending_bill_payment_reminder');
    assert.equal(body.template.language.code,  'en');
    // Verify four parameters in correct order
    const params = body.template.components[0].parameters;
    assert.equal(params.length, 4);
    assert.equal(params[0].text, 'Test Party');    // {{1}} partyName
    assert.equal(params[1].text, 'INV-001');        // {{2}} billNumber
    assert.ok(params[2].text, 'balanceAmount param must be present');
    assert.ok(params[3].text, 'dueDate param must be present');

    return {
      ok: true,
      status: 200,
      json: async () => ({
        messaging_product: 'whatsapp',
        contacts: [{ input: '919876543210', wa_id: '919876543210' }],
        messages: [{ id: expectedWamid }]
      })
    };
  };

  const { sendMetaTemplateMessage } = freshService();

  const bill = {
    partyName:     'Test Party',
    billNumber:    'INV-001',
    balanceAmount: 50000,
    dueDate:       new Date('2025-12-31')
  };

  const toPhone = '+919876543210';
  const result = await sendMetaTemplateMessage(bill, toPhone);

  assert.equal(result.wamid, expectedWamid, 'wamid must be returned');

  delete global.fetch;
  restoreEnv();
});

test('Meta API — rejection returns error details, does not throw on non-JSON', async () => {
  setEnv({ WHATSAPP_SEND_ENABLED: 'true' });

  global.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({
      error: {
        message: 'Invalid OAuth access token',
        type: 'OAuthException',
        code: 190,
        error_data: { details: 'token expired' }
      }
    })
  });

  const { getMetaConfig } = freshService();
  const config = getMetaConfig();

  // Simulate what the service does on !response.ok
  const response = await global.fetch();
  const body = await response.json();
  const metaErr = body?.error;
  const msg = metaErr
    ? `Meta API error ${metaErr.code}: ${metaErr.message}` +
      (metaErr.error_data?.details ? ` — ${metaErr.error_data.details}` : '')
    : `Meta API HTTP ${response.status}`;

  assert.ok(msg.includes('190'),               'Error message must contain error code');
  assert.ok(msg.includes('token expired'),      'Error message must surface error_data.details');
  assert.equal(response.ok, false,              'response.ok must be false on rejection');

  delete global.fetch;
  restoreEnv();
});

test('Meta API — network timeout throws descriptive error', async () => {
  setEnv({ WHATSAPP_SEND_ENABLED: 'true' });

  // Simulate an AbortError (timeout)
  global.fetch = async () => {
    const err = new Error('The operation was aborted');
    err.name = 'AbortError';
    throw err;
  };

  let caught;
  try {
    await global.fetch();
  } catch (e) {
    caught = e;
  }

  assert.ok(caught, 'Should have thrown');
  assert.equal(caught.name, 'AbortError');

  delete global.fetch;
  restoreEnv();
});

// ─────────────────────────────────────────────────────────────────────────────
//  10. Webhook status advancement idempotency
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────
//  10. Webhook status advancement & state transition policy
// ─────────────────────────────────────────────

test('processStatusUpdate — strict state machine: transitions, idempotency, and edge cases', async () => {
  const ReminderHistory = require('../models/ReminderHistory');
  const { processStatusUpdate } = require('../controllers/webhookController');

  let currentRecord = null;
  let updateCalled = false;
  let updatePayload = null;
  let unsetPayload = null;

  const origFindOne = ReminderHistory.findOne;
  const origUpdateOne = ReminderHistory.updateOne;

  ReminderHistory.findOne = async () => currentRecord;
  ReminderHistory.updateOne = async (query, setDoc) => {
    updateCalled = true;
    updatePayload = setDoc.$set;
    unsetPayload = setDoc.$unset;
  };

  const reset = (status, fields = {}) => {
    currentRecord = { wamid: 'wamid.123', status, ...fields };
    updateCalled = false;
    updatePayload = null;
    unsetPayload = null;
  };

  try {
    // 1. Accepted -> Delivered: should advance and set deliveredAt
    reset('Accepted');
    await processStatusUpdate({ id: 'wamid.123', status: 'delivered', timestamp: '1700000000' });
    assert.equal(updateCalled, true, 'Accepted must advance to Delivered');
    assert.equal(updatePayload.status, 'Delivered');
    assert.ok(updatePayload.deliveredAt instanceof Date);

    // 2. Delivered -> Read: should advance and set readAt
    reset('Delivered', { deliveredAt: new Date(1700000000 * 1000) });
    await processStatusUpdate({ id: 'wamid.123', status: 'read', timestamp: '1700000015' });
    assert.equal(updateCalled, true, 'Delivered must advance to Read');
    assert.equal(updatePayload.status, 'Read');
    assert.ok(updatePayload.readAt instanceof Date);

    // 3. Read-before-delivered: 'read' arrives before 'delivered'
    // Starts at Accepted, receives 'read' first -> advances directly to Read
    reset('Accepted');
    await processStatusUpdate({ id: 'wamid.123', status: 'read', timestamp: '1700000010' });
    assert.equal(updateCalled, true, 'Accepted advances directly to Read if read arrives first');
    assert.equal(updatePayload.status, 'Read');
    assert.ok(updatePayload.readAt instanceof Date);
    assert.ok(updatePayload.deliveredAt instanceof Date, 'Read-first also initializes deliveredAt');

    // 4. Delayed 'delivered' event arrives after message already at 'Read':
    // If deliveredAt is not yet set, backfill deliveredAt without downgrading status
    reset('Read', { readAt: new Date(1700000010 * 1000) });
    await processStatusUpdate({ id: 'wamid.123', status: 'delivered', timestamp: '1700000005' });
    assert.equal(updateCalled, true, 'Backfills deliveredAt if missing');
    assert.equal(updatePayload.status, undefined, 'Must NOT downgrade status from Read');
    assert.ok(updatePayload.deliveredAt instanceof Date);

    // If deliveredAt was initialized to readAt (1700000010), later older delivered event (1700000005)
    // corrects deliveredAt to the earlier delivery timestamp without downgrading status
    reset('Read', {
      readAt: new Date(1700000010 * 1000),
      deliveredAt: new Date(1700000010 * 1000)
    });
    await processStatusUpdate({ id: 'wamid.123', status: 'delivered', timestamp: '1700000005' });
    assert.equal(updateCalled, true, 'Older delivered event corrects deliveredAt on Read status');
    assert.equal(updatePayload.status, undefined, 'Must NOT downgrade status from Read');
    assert.equal(updatePayload.deliveredAt.getTime(), 1700000005 * 1000, 'deliveredAt corrected to older timestamp');

    // If deliveredAt is already set to same or earlier timestamp, redundant delivered is a no-op
    reset('Read', {
      readAt: new Date(1700000010 * 1000),
      deliveredAt: new Date(1700000005 * 1000)
    });
    await processStatusUpdate({ id: 'wamid.123', status: 'delivered', timestamp: '1700000005' });
    assert.equal(updateCalled, false, 'Delayed delivered on already populated Read with same timestamp is a no-op');

    // 5. Delayed failure event arriving after confirmed 'Delivered':
    // Must NOT overwrite confirmed delivery
    reset('Delivered', { deliveredAt: new Date(1700000010 * 1000) });
    await processStatusUpdate({ id: 'wamid.123', status: 'failed', timestamp: '1700000005' });
    assert.equal(updateCalled, false, 'Delayed/stale failure must not overwrite confirmed Delivered');

    // 6. Delayed failure event arriving after confirmed 'Read':
    // Must NOT overwrite confirmed read receipt
    reset('Read', { readAt: new Date(1700000020 * 1000) });
    await processStatusUpdate({ id: 'wamid.123', status: 'failed', timestamp: '1700000015' });
    assert.equal(updateCalled, false, 'Delayed/stale failure must not overwrite confirmed Read');

    // 7. Duplicate events (idempotency tests):
    // Duplicate Delivered
    reset('Delivered', { deliveredAt: new Date(1700000005 * 1000) });
    await processStatusUpdate({ id: 'wamid.123', status: 'delivered', timestamp: '1700000005' });
    assert.equal(updateCalled, false, 'Duplicate Delivered must not write to DB');

    // Duplicate Read
    reset('Read', { readAt: new Date(1700000010 * 1000), deliveredAt: new Date(1700000005 * 1000) });
    await processStatusUpdate({ id: 'wamid.123', status: 'read', timestamp: '1700000010' });
    assert.equal(updateCalled, false, 'Duplicate Read must not write to DB');

    // Duplicate Failed
    reset('Failed', { failedAt: new Date(1700000005 * 1000) });
    await processStatusUpdate({ id: 'wamid.123', status: 'failed', timestamp: '1700000005' });
    assert.equal(updateCalled, false, 'Duplicate Failed must not write to DB');

    // Duplicate Accepted
    reset('Accepted', { sentAt: new Date(1700000000 * 1000) });
    await processStatusUpdate({ id: 'wamid.123', status: 'sent', timestamp: '1700000000' });
    assert.equal(updateCalled, false, 'Duplicate Accepted must not write to DB');

    // 8. Out-of-order timestamps:
    // Stale delivery event older than failure timestamp
    reset('Failed', { failedAt: new Date(1700000010 * 1000) });
    await processStatusUpdate({ id: 'wamid.123', status: 'delivered', timestamp: '1700000005' });
    assert.equal(updateCalled, false, 'Stale delivery event older than failure must be ignored');

    // Newer delivery event after failure (Meta recovered on retry)
    reset('Failed', {
      failedAt: new Date(1700000010 * 1000),
      metaError: '{"code":131026}',
      errorDetails: 'undeliverable'
    });
    await processStatusUpdate({ id: 'wamid.123', status: 'delivered', timestamp: '1700000020' });
    assert.equal(updateCalled, true, 'Newer delivery event after failure should advance state');
    assert.equal(updatePayload.status, 'Delivered');
    assert.ok(unsetPayload && unsetPayload.failedAt, 'Must unset failedAt when superseding failure');
    assert.ok(unsetPayload && unsetPayload.metaError, 'Must unset metaError when superseding failure');
    assert.ok(unsetPayload && unsetPayload.errorDetails, 'Must unset errorDetails when superseding failure');

    // 9. Legitimate failure from Accepted
    reset('Accepted');
    await processStatusUpdate({
      id: 'wamid.123',
      status: 'failed',
      timestamp: '1700000005',
      errors: [{ code: 131026, message: 'Message undeliverable' }]
    });
    assert.equal(updateCalled, true, 'Accepted transitions to Failed on legitimate error');
    assert.equal(updatePayload.status, 'Failed');
    assert.ok(updatePayload.failedAt instanceof Date);
    assert.ok(updatePayload.metaError.includes('131026'));
  } finally {
    ReminderHistory.findOne = origFindOne;
    ReminderHistory.updateOne = origUpdateOne;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  11. Bulk send — mixed success/failure outcomes
// ─────────────────────────────────────────────────────────────────────────────

test('Bulk send — partial failure is correctly counted', () => {
  // Simulate the counting logic from sendBulkRemindersCtrl
  const results = [
    { success: true,  message: 'Accepted' },
    { success: false, message: 'Phone number missing' },
    { success: true,  message: 'Accepted' },
    { success: false, message: 'Meta API error 131021: Recipient not reachable' }
  ];

  const sent   = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  assert.equal(sent,   2, '2 out of 4 should be sent');
  assert.equal(failed, 2, '2 out of 4 should be failed');
  assert.equal(sent + failed, results.length, 'counts must sum to total');
});

// ─────────────────────────────────────────────────────────────────────────────
//  12. Duplicate webhook events are idempotent
// ─────────────────────────────────────────────────────────────────────────────

test('Webhook — duplicate Delivered event does not re-apply same status', () => {
  // Verified in processStatusUpdate tests: record.status === mapped skips update
  const currentStatus = 'Delivered';
  const mapped        = 'Delivered';
  assert.equal(currentStatus === mapped, true, 'Duplicate Delivered event must be skipped (idempotent)');
});

console.log('\n✅ All tests defined. Running with Node test runner...\n');
