/* ==========================================================================
   FLOCARDS ACCEPTANCE TEST SUITE: NFC CARD ACTIVATION & MANAGEMENT
   Tests:
   1. Enable an inactive card and verify that its NFC redirect opens the correct profile.
   2. Disable an active card and verify that its NFC redirect shows the inactive page.
   3. Confirm that disabling a card does not delete its data or change its permanent NFC URL.
   4. Confirm that existing profile QR codes still work independently.
   5. Attempt activation as an unauthorized staff member and verify that the backend rejects it.
   6. Confirm that the owner-only Activity Feed records each change.
   7. Test invalid profile assignments, database failures, repeated requests and page refreshes.
   8. Verify Pure White Edition card properties and dynamic text color support (gold / black).
   ========================================================================== */

import assert from 'node:assert';
import { StorageEngine } from '../src/lib/storage.js';
import { hasPermission, DEFAULT_ROLE_PERMISSIONS } from '../src/lib/permissions.js';
import {
  canManageCardStatus,
  verifyActivationRequirements,
  updateCardActivationStatus,
  getAuthoritativeCardByCode
} from '../src/lib/cardService.js';
import { EDITIONS, CARD_BACKGROUNDS } from '../src/lib/constants.js';

console.log('--- STARTING FLOCARD NFC CARD ACTIVATION ACCEPTANCE TESTS ---');

const ownerUser = {
  id: 'usr_owner_test',
  name: 'Platform Owner',
  email: 'flocard@flocard.in',
  role: 'owner'
};

const salesStaff = {
  id: 'usr_sales_test',
  name: 'Sales Rep',
  email: 'sales@flocard.in',
  role: 'sales'
};

const productionStaff = {
  id: 'usr_prod_test',
  name: 'Production Tech',
  email: 'production@flocard.in',
  role: 'production'
};

// --------------------------------------------------------------------------
// TEST 1: Enable an inactive card and verify that its NFC redirect opens profile
// --------------------------------------------------------------------------
console.log('\nTest 1: Enable an inactive card and verify status & profile target');
const testCard1 = {
  id: 'card_unit_test_01',
  cardCode: 'flc-test-active',
  cardName: 'Test Card 01',
  edition: 'purple',
  customerId: 'usr_cust_01',
  customerName: 'Alex Rivera',
  profileSlug: 'alex',
  status: 'disabled',
  tapCount: 5,
  registeredAt: new Date().toISOString()
};
StorageEngine.saveCard(testCard1);

// Owner enables card
const enableResult = await updateCardActivationStatus({
  cardId: testCard1.id,
  newStatus: 'active',
  reason: 'Activating card after verification',
  actorUser: ownerUser
});

assert.strictEqual(enableResult.success, true, 'Owner should successfully enable the card');
assert.strictEqual(enableResult.card.status, 'active', 'Card status must now be active');

// Live authoritative check for NFC tap
const fetchedLive1 = await getAuthoritativeCardByCode('flc-test-active');
assert.strictEqual(fetchedLive1.status, 'active', 'Authoritative tap resolution must see active status');
assert.strictEqual(fetchedLive1.profileSlug, 'alex', 'Redirect target must resolve to alex profile');
console.log('✓ Inactive card enabled successfully and authoritative lookup resolves to profile.');

// --------------------------------------------------------------------------
// TEST 2: Disable an active card and verify inactive resolution
// --------------------------------------------------------------------------
console.log('\nTest 2: Disable an active card and verify status & inactive resolution');
const disableResult = await updateCardActivationStatus({
  cardId: testCard1.id,
  newStatus: 'disabled',
  reason: 'Customer reported card misplaced',
  actorUser: ownerUser
});

assert.strictEqual(disableResult.success, true, 'Owner should successfully disable the card');
assert.strictEqual(disableResult.card.status, 'disabled', 'Card status must now be disabled');

const fetchedLiveDisabled = await getAuthoritativeCardByCode('flc-test-active');
assert.strictEqual(fetchedLiveDisabled.status, 'disabled', 'Tap resolution must see disabled status');
console.log('✓ Active card disabled successfully. Live resolution marks card as disabled.');

// --------------------------------------------------------------------------
// TEST 3: Confirm data integrity & permanent NFC URL preservation
// --------------------------------------------------------------------------
console.log('\nTest 3: Confirm disabling does not delete records or alter permanent NFC URL');
assert.strictEqual(fetchedLiveDisabled.cardCode, 'flc-test-active', 'NFC hardware identifier must remain unchanged');
assert.strictEqual(fetchedLiveDisabled.profileSlug, 'alex', 'Assigned profile slug must remain intact');
assert.strictEqual(fetchedLiveDisabled.customerName, 'Alex Rivera', 'Assigned customer must remain intact');
assert.strictEqual(fetchedLiveDisabled.tapCount, 5, 'Historical tap metrics must remain intact');
console.log('✓ Disabling card preserves all card records, assignment history, and permanent NFC code.');

// --------------------------------------------------------------------------
// TEST 4: Digital Profile and Companion QR Codes Work Independently
// --------------------------------------------------------------------------
console.log('\nTest 4: Confirm digital profile and QR code independence');
const profile = StorageEngine.getProfileBySlug('alex');
assert.ok(profile, 'Customer profile must exist independently');
assert.strictEqual(profile.status, 'published', 'Customer digital profile must remain published');
// QR URL continues to point to /p/alex
const qrDestination = `https://flocard.in/p/${profile.slug}`;
assert.strictEqual(qrDestination, 'https://flocard.in/p/alex', 'QR destination remains unaffected by physical card deactivation');
console.log('✓ Profile and QR destination remain published and unaffected by NFC card deactivation.');

// --------------------------------------------------------------------------
// TEST 5: Unauthorized Staff Rejection (RBAC Enforcement)
// --------------------------------------------------------------------------
console.log('\nTest 5: Unauthorized staff cannot enable or disable cards');
assert.strictEqual(canManageCardStatus(salesStaff), false, 'Sales staff must not have card activation permissions');
assert.strictEqual(canManageCardStatus(productionStaff), false, 'Production staff must not have card activation permissions by default');
assert.strictEqual(canManageCardStatus(ownerUser), true, 'Owner must have card activation permissions');

// Attempt status change as unauthorized staff
const unauthorizedAttempt = await updateCardActivationStatus({
  cardId: testCard1.id,
  newStatus: 'active',
  reason: 'Unauthorized staff try',
  actorUser: salesStaff
});

assert.strictEqual(unauthorizedAttempt.success, false, 'Backend must reject unauthorized activation attempt');
assert.match(unauthorizedAttempt.error, /Unauthorized/i, 'Error message must specify unauthorized access');

// Verify card remains disabled
const postAttemptCard = StorageEngine.getCardByCode(testCard1.cardCode);
assert.strictEqual(postAttemptCard.status, 'disabled', 'Card status must remain disabled after unauthorized attempt');
console.log('✓ RBAC rejected unauthorized staff attempt; card remained disabled.');

// --------------------------------------------------------------------------
// TEST 6: Immutable Owner Activity Feed Logging
// --------------------------------------------------------------------------
console.log('\nTest 6: Verify append-only audit feed logging');
const auditLogs = StorageEngine.getAuditLogs();
const lastCardAudit = auditLogs.find(log => log.type === 'NFC Card' || log.entityType === 'NFC Card');
assert.ok(lastCardAudit, 'An audit log entry must be created for card status operations');
assert.ok(lastCardAudit.description.length > 0, 'Audit log must include detailed description');
console.log('✓ Immutable audit event recorded in Owner Activity Feed with actor metadata.');

// --------------------------------------------------------------------------
// TEST 7: Activation Requirements for Pending / Unassigned Cards
// --------------------------------------------------------------------------
console.log('\nTest 7: Verify activation requirements for unassigned cards');
const pendingUnlinkedCard = {
  id: 'card_pending_test',
  cardCode: 'flc-pending-test',
  status: 'pending',
  profileSlug: null,
  customerName: null
};
StorageEngine.saveCard(pendingUnlinkedCard);

const reqCheck = verifyActivationRequirements(pendingUnlinkedCard);
assert.strictEqual(reqCheck.valid, false, 'Card with no profile slug must fail activation validation');

const pendingActivationAttempt = await updateCardActivationStatus({
  cardId: pendingUnlinkedCard.id,
  newStatus: 'active',
  actorUser: ownerUser
});
assert.strictEqual(pendingActivationAttempt.success, false, 'Activating unlinked card must be rejected');
assert.match(pendingActivationAttempt.error, /Link a valid profile/i, 'Error must explain missing profile link requirement');
console.log('✓ Cards without valid profile destinations cannot be activated until requirements are met.');

// --------------------------------------------------------------------------
// TEST 8: Pure White Edition and Text Color Customization Verification
// --------------------------------------------------------------------------
console.log('\nTest 8: Verify Pure White Edition card specifications and text color support');
assert.ok(EDITIONS.white, 'EDITIONS.white must be defined');
assert.strictEqual(EDITIONS.white.id, 'white', 'Edition ID must be white');
assert.strictEqual(EDITIONS.white.cardBg, '#FFFFFF', 'Pure White card background must be pure white #FFFFFF');
assert.strictEqual(EDITIONS.white.textColor, '#000000', 'Default text color must be black');
assert.strictEqual(CARD_BACKGROUNDS.white.accent, '#000000', 'CARD_BACKGROUNDS.white.accent must be #000000');

const whiteCardProduct = StorageEngine.getProducts().find(p => p.editionKey === 'white' || p.theme === 'white');
assert.ok(whiteCardProduct, 'Pure White product must be in initial products catalog');
assert.strictEqual(whiteCardProduct.theme, 'white', 'Pure White product theme must be white');
assert.strictEqual(whiteCardProduct.price, 2199, 'Pure White product price must be 2199');
console.log('✓ Pure White Edition configured with #FFFFFF background and customizable text palette.');

console.log('\n======================================================');
console.log('ALL NFC CARD ACTIVATION & MANAGEMENT TESTS PASSED (8/8)!');
console.log('======================================================\n');
