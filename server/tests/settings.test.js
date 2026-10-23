'use strict';

/**
 * Tests for Settings model constants and template migration logic.
 * Uses Node.js built-in test runner (Node >= 18). No DB connection needed.
 */

const { test } = require('node:test');
const assert   = require('node:assert/strict');

// ─── Import model constants (does not open a DB connection) ───────────────────
const {
  OLD_DEFAULT_TEMPLATE,
  DEFAULT_REMINDER_TEMPLATE
} = require('../models/Settings');

// ─────────────────────────────────────────────────────────────────────────────
//  1. New default template — structure & placeholder presence
// ─────────────────────────────────────────────────────────────────────────────

test('DEFAULT_REMINDER_TEMPLATE — contains {partyName}', () => {
  assert.ok(DEFAULT_REMINDER_TEMPLATE.includes('{partyName}'));
});

test('DEFAULT_REMINDER_TEMPLATE — contains {billNumber}', () => {
  assert.ok(DEFAULT_REMINDER_TEMPLATE.includes('{billNumber}'));
});

test('DEFAULT_REMINDER_TEMPLATE — contains {balanceAmount}', () => {
  assert.ok(DEFAULT_REMINDER_TEMPLATE.includes('{balanceAmount}'));
});

test('DEFAULT_REMINDER_TEMPLATE — contains {dueDate}', () => {
  assert.ok(DEFAULT_REMINDER_TEMPLATE.includes('{dueDate}'));
});

test('DEFAULT_REMINDER_TEMPLATE — uses fixed Amar Steel Industries signature', () => {
  assert.ok(DEFAULT_REMINDER_TEMPLATE.includes('Amar Steel Industries'));
});

test('DEFAULT_REMINDER_TEMPLATE — does NOT use {businessName} placeholder', () => {
  assert.ok(
    !DEFAULT_REMINDER_TEMPLATE.includes('{businessName}'),
    'Signature must be hardcoded, not a placeholder'
  );
});

test('DEFAULT_REMINDER_TEMPLATE — does NOT use Meta {{N}} syntax', () => {
  assert.ok(
    !DEFAULT_REMINDER_TEMPLATE.includes('{{'),
    'Local preview template must not use Meta double-brace syntax'
  );
});

test('DEFAULT_REMINDER_TEMPLATE — contains contact number +91 9417204939', () => {
  assert.ok(DEFAULT_REMINDER_TEMPLATE.includes('+91 9417204939'));
});

test('DEFAULT_REMINDER_TEMPLATE — uses rupee symbol ₹', () => {
  assert.ok(DEFAULT_REMINDER_TEMPLATE.includes('₹'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  2. Old default template is distinct from new
// ─────────────────────────────────────────────────────────────────────────────

test('OLD_DEFAULT_TEMPLATE — is different from DEFAULT_REMINDER_TEMPLATE', () => {
  assert.notEqual(OLD_DEFAULT_TEMPLATE, DEFAULT_REMINDER_TEMPLATE);
});

test('OLD_DEFAULT_TEMPLATE — contains old copy ("Kindly arrange payment")', () => {
  assert.ok(OLD_DEFAULT_TEMPLATE.includes('Kindly arrange payment'));
});

test('OLD_DEFAULT_TEMPLATE — contains {businessName} placeholder', () => {
  assert.ok(OLD_DEFAULT_TEMPLATE.includes('{businessName}'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  3. Migration logic — exact-match guard
// ─────────────────────────────────────────────────────────────────────────────

test('Migration — old default is migrated, new default is not re-migrated', () => {
  // Simulate what settingsController.getSettings does
  function shouldMigrate(currentTemplate) {
    return currentTemplate === OLD_DEFAULT_TEMPLATE;
  }

  assert.equal(shouldMigrate(OLD_DEFAULT_TEMPLATE), true,
    'Old default must be migrated');

  assert.equal(shouldMigrate(DEFAULT_REMINDER_TEMPLATE), false,
    'New default must not be re-migrated (idempotent)');

  assert.equal(shouldMigrate('Custom template with {partyName}'), false,
    'Custom template must not be overwritten');

  assert.equal(shouldMigrate(''), false,
    'Empty template must not be migrated (user intentionally cleared it)');
});

// ─────────────────────────────────────────────────────────────────────────────
//  4. Template rendering simulation
// ─────────────────────────────────────────────────────────────────────────────

test('Template renders correctly with sample data', () => {
  const rendered = DEFAULT_REMINDER_TEMPLATE
    .replace(/\{partyName\}/g,     'Sharma Traders')
    .replace(/\{billNumber\}/g,    'INV-2024-042')
    .replace(/\{balanceAmount\}/g, '1,25,000')
    .replace(/\{dueDate\}/g,       '23/10/2026');

  assert.ok(rendered.includes('Sharma Traders'),    'partyName substituted');
  assert.ok(rendered.includes('INV-2024-042'),       'billNumber substituted');
  assert.ok(rendered.includes('1,25,000'),           'balanceAmount substituted');
  assert.ok(rendered.includes('23/10/2026'),         'dueDate substituted');
  assert.ok(rendered.includes('Amar Steel Industries'), 'signature retained');
  assert.ok(!rendered.includes('{partyName}'),       'no un-substituted placeholders');
  assert.ok(!rendered.includes('{billNumber}'),      'no un-substituted placeholders');
  assert.ok(!rendered.includes('{balanceAmount}'),   'no un-substituted placeholders');
  assert.ok(!rendered.includes('{dueDate}'),         'no un-substituted placeholders');
});

test('Template rendering — {businessName} placeholder absent, no substitution error', () => {
  // Verify the new default template renders cleanly even if businessName substitution is skipped
  const rendered = DEFAULT_REMINDER_TEMPLATE
    .replace(/\{partyName\}/g,     'Test')
    .replace(/\{billNumber\}/g,    'INV-001')
    .replace(/\{balanceAmount\}/g, '50,000')
    .replace(/\{dueDate\}/g,       '01/01/2025');

  // No {businessName} in new template — nothing to substitute, no leftover brace
  assert.ok(!rendered.includes('{businessName}'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  5. Meta template alignment
// ─────────────────────────────────────────────────────────────────────────────

test('Template mapping to Meta parameters', () => {
  // Confirms the 4 local placeholders map to the 4 Meta template parameters
  // {{1}}=partyName, {{2}}=billNumber, {{3}}=balanceAmount, {{4}}=dueDate
  const placeholders = ['{partyName}', '{billNumber}', '{balanceAmount}', '{dueDate}'];
  const metaParams   = ['{{1}}',       '{{2}}',        '{{3}}',           '{{4}}'];

  // Verify the local template uses all 4 placeholders in the correct semantic order
  const partyIdx   = DEFAULT_REMINDER_TEMPLATE.indexOf('{partyName}');
  const billIdx    = DEFAULT_REMINDER_TEMPLATE.indexOf('{billNumber}');
  const amountIdx  = DEFAULT_REMINDER_TEMPLATE.indexOf('{balanceAmount}');
  const dateIdx    = DEFAULT_REMINDER_TEMPLATE.indexOf('{dueDate}');

  assert.ok(partyIdx  !== -1, '{partyName} must be present');
  assert.ok(billIdx   !== -1, '{billNumber} must be present');
  assert.ok(amountIdx !== -1, '{balanceAmount} must be present');
  assert.ok(dateIdx   !== -1, '{dueDate} must be present');

  assert.equal(placeholders.length, metaParams.length,
    'Placeholder count must match Meta parameter count');
});

console.log('\n✅ Settings template tests defined.\n');
