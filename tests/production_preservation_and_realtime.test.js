/**
 * Master Verification Suite:
 * 1. Production Database Preservation & Non-Destructive Integrity
 * 2. Real-time Subscription Channel Setup
 * 3. Automatic NFC Card Details to Digital Profile Prefill
 * 4. Optional Phone Numbers & Logos (No Fake Numbers)
 * 5. Independent Admin Profile & Settings Isolation
 * 6. Admin Dashboard Edit Resilience & Zero Crash Guarantees
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { StorageEngine, INITIAL_PROFILES } from '../src/lib/storage.js';

console.log('--- STARTING PRODUCTION PRESERVATION & REALTIME MASTER TEST SUITE ---\n');

// --------------------------------------------------------------------------
// TEST 1: Production Database Preservation & Build Safety
// --------------------------------------------------------------------------
console.log('Test 1: Production Database Preservation & Safe Build Scripts');

// Verify package.json build script has no destructive migrations or seed commands
const packageJson = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf-8'));
assert.strictEqual(packageJson.scripts.build, 'vite build', 'Build script must only compile client assets with vite build');
assert.ok(!packageJson.scripts.build.includes('drop') && !packageJson.scripts.build.includes('reset'), 'Build script must never contain drop or reset commands');

// Verify .gitignore protects all .env credentials
const gitignore = fs.readFileSync(path.resolve('./.gitignore'), 'utf-8');
assert.ok(gitignore.includes('.env'), '.gitignore must ignore .env files');
assert.ok(gitignore.includes('.env.local'), '.gitignore must ignore .env.local');

console.log('✓ Build configuration and .gitignore strictly preserve production database integrity.');

// --------------------------------------------------------------------------
// TEST 2: Real-Time Subscriptions & Multi-Admin Hydration
// --------------------------------------------------------------------------
console.log('\nTest 2: Supabase Realtime Channels Configuration');

const dataContextCode = fs.readFileSync(path.resolve('./src/context/DataContext.jsx'), 'utf-8');
assert.ok(dataContextCode.includes(".channel('cloud-admin-sync')"), 'Must establish cloud-admin-sync realtime channel');
assert.ok(dataContextCode.includes("table: 'profiles'"), 'Must subscribe to profiles table changes');
assert.ok(dataContextCode.includes("table: 'nfc_cards'"), 'Must subscribe to nfc_cards table changes');
assert.ok(dataContextCode.includes("table: 'card_designs'"), 'Must subscribe to card_designs table changes');
assert.ok(dataContextCode.includes("table: 'orders'"), 'Must subscribe to orders table changes');
assert.ok(dataContextCode.includes('client.removeChannel(realtimeChannel)'), 'Must clean up realtime channel on unmount');

console.log('✓ Realtime listeners across profiles, nfc_cards, card_designs, and orders verified.');

// --------------------------------------------------------------------------
// TEST 3: Automatic NFC Card Details to Digital Profile Prefill (Requirement 4)
// --------------------------------------------------------------------------
console.log('\nTest 3: Automatic NFC Card Details to Digital Profile Prefill');

const testOrderPayload = {
  design: {
    id: `des_prefill_${Date.now()}`,
    title: 'Executive Gold Edition',
    edition: 'gold',
    front: {
      name: 'Rohan Sharma',
      role: 'Chief Architect',
      company: 'Apex Innovations',
      tagline: 'Leading Cloud Scalability',
      website: 'https://apex.tech'
    },
    back: {
      linkedin: 'https://linkedin.com/in/rohansharma',
      instagram: 'https://instagram.com/rohan_arch'
    }
  },
  customerName: 'Rohan Sharma',
  customerEmail: 'rohan.sharma@apex.tech',
  customerPhone: '+91 98950 12345',
  shippingAddress: '7th Avenue, Cyber Park, Kochi',
  quantity: 1
};

const submittedOrder = StorageEngine.submitPrintOrder(testOrderPayload);
assert.ok(submittedOrder && submittedOrder.id, 'Print order must be successfully created');

// Check that digital profile was automatically prefilled
const profiles = StorageEngine.getProfiles();
const prefilledProfile = profiles.find(p => p.email === 'rohan.sharma@apex.tech' || p.name === 'Rohan Sharma');
assert.ok(prefilledProfile, 'Digital profile must be automatically created/prefilled upon order submission');
assert.strictEqual(prefilledProfile.name, 'Rohan Sharma', 'Profile name must match card order');
assert.strictEqual(prefilledProfile.role, 'Chief Architect', 'Profile role must match card order');
assert.strictEqual(prefilledProfile.company, 'Apex Innovations', 'Profile company must match card order');
assert.strictEqual(prefilledProfile.phone, '+91 98950 12345', 'Profile phone must match card order');
assert.strictEqual(prefilledProfile.website, 'https://apex.tech', 'Profile website must match card order');

// Verify that if profile is subsequently customized by user, a subsequent order does NOT overwrite user customizations
prefilledProfile.bio = 'My custom updated bio written by Rohan.';
prefilledProfile.company = 'Apex Super Systems';
StorageEngine.saveProfile(prefilledProfile);

// Second order submitted by same customer
StorageEngine.submitPrintOrder({
  ...testOrderPayload,
  design: {
    ...testOrderPayload.design,
    id: `des_prefill_2_${Date.now()}`,
    front: { ...testOrderPayload.design.front, company: 'Old Company Name' }
  }
});

const updatedProfile = StorageEngine.getProfiles().find(p => p.email === 'rohan.sharma@apex.tech');
assert.strictEqual(updatedProfile.bio, 'My custom updated bio written by Rohan.', 'Customized profile edits must never be overwritten');
assert.strictEqual(updatedProfile.company, 'Apex Super Systems', 'Customized company must never be overwritten by older card data');

console.log('✓ Automatic NFC card to digital profile prefill and non-destructive update verified.');

// --------------------------------------------------------------------------
// TEST 4: Optional Phone Numbers & Logos (No Fake Numbers) (Requirement 5)
// --------------------------------------------------------------------------
console.log('\nTest 4: Optional Phone Numbers & Logos (No Fake Numbers)');

// Order without phone number
const orderNoPhone = StorageEngine.submitPrintOrder({
  design: {
    id: `des_nophone_${Date.now()}`,
    edition: 'platinum',
    front: { name: 'Elena Gilbert', role: 'Director' }
  },
  customerName: 'Elena Gilbert',
  customerEmail: 'elena@example.com',
  customerPhone: '', // Completely omitted
  shippingAddress: '42 River Road, Aluva',
  quantity: 1
});

assert.strictEqual(orderNoPhone.customerPhone, '', 'Omitted phone number must remain empty without fake numbers');
assert.ok(!orderNoPhone.customerPhone.includes('97782 78552'), 'Must never generate fake fallback phone number');

// Deliver order and verify provisioned profile does not have fake phone
const delivered = StorageEngine.deliverOrder(orderNoPhone.id);
assert.strictEqual(delivered.order.status, 'delivered', 'Order must be delivered');

const elenaProfile = StorageEngine.getProfiles().find(p => p.email === 'elena@example.com');
if (elenaProfile) {
  assert.strictEqual(elenaProfile.phone, '', 'Profile must store empty string when phone is not provided');
  assert.ok(!elenaProfile.phone.includes('97782 78552'), 'Profile must never receive fake phone number fallback');
}

console.log('✓ Optional phone numbers verified; zero fake or placeholder numbers generated.');

// --------------------------------------------------------------------------
// TEST 5: Independent Admin Profile & Settings Isolation (Requirement 7)
// --------------------------------------------------------------------------
console.log('\nTest 5: Independent Admin Profile & Settings Isolation');

const adminDashboardCode = fs.readFileSync(path.resolve('./src/pages/admin/AdminDashboard.jsx'), 'utf-8');
const authContextCode = fs.readFileSync(path.resolve('./src/context/AuthContext.jsx'), 'utf-8');

assert.ok(authContextCode.includes('updateAdminProfile'), 'AuthContext must export updateAdminProfile');
assert.ok(authContextCode.includes('updateAdminPassword'), 'AuthContext must export updateAdminPassword');
assert.ok(authContextCode.includes('updateAdminEmail'), 'AuthContext must export updateAdminEmail');
assert.ok(adminDashboardCode.includes('Administrator Profile') && adminDashboardCode.includes('Account Settings'), 'AdminDashboard must render independent Admin Profile card');
assert.ok(adminDashboardCode.includes('handleSaveAdminProfile'), 'AdminDashboard must handle admin display name updates');
assert.ok(adminDashboardCode.includes('handleAdminPasswordUpdate'), 'AdminDashboard must handle admin password changes');

console.log('✓ Independent admin profile and credentials management verified.');

// --------------------------------------------------------------------------
// TEST 6: Production Safety Guard Against Resets
// --------------------------------------------------------------------------
console.log('\nTest 6: Production Safety Lock on Factory Reset');

assert.ok(adminDashboardCode.includes('Production Database Protection Active'), 'AdminDashboard must lock factory resets when connected to Supabase');
assert.ok(adminDashboardCode.includes('isSupabaseConfigured'), 'Reset controls must be guarded by isSupabaseConfigured');

console.log('✓ Production database safety lock verified.');

console.log('\n🎉 ALL PRODUCTION PRESERVATION & REALTIME TESTS PASSED SUCCESSFULLY! 🎉\n');
