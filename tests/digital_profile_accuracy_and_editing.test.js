/* ==========================================================================
   FLOCARDS DIGITAL PROFILE DATA ACCURACY & EDITING TEST SUITE
   Validates:
   1. Exact Name from Customer's NFC Card (Priority 1: design.front.name)
   2. No Logo Means No Logo (no default SVG, no 'ARCHIERIO', no placeholder)
   3. Never Invent Customer Information (no fake company, role, bio, services)
   4. Complete Customer-Side Editing (save, replace, remove logo/avatar)
   5. Complete Admin-Side Editing (save, isolation across profiles)
   6. Data Isolation between distinct customer profiles (no cross-leakage)
   7. Public Profile Privacy (unknown slug does not leak Alex Morgan)
   ========================================================================== */

import assert from 'node:assert/strict';
import { StorageEngine, INITIAL_PROFILES } from '../src/lib/storage.js';

// Polyfill minimal browser globals for Node test environment
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => {},
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    },
    sessionStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    }
  };
  globalThis.localStorage = globalThis.window.localStorage;
  globalThis.sessionStorage = globalThis.window.sessionStorage;
}

console.log('\n--- STARTING DIGITAL PROFILE DATA ACCURACY & EDITING TEST SUITE ---');

// Test 1: Exact Name from Customer's NFC Card
console.log('\nTest 1: Exact Name from Customer NFC Card');
{
  const submittedDesign = {
    id: 'des_shamil_001',
    title: 'Executive Purple Metal',
    edition: 'purple',
    front: {
      name: 'Muhammed Shamil',
      role: 'Hardware Systems Architect',
      company: 'Zenith Labs'
    },
    back: {}
  };

  const orderPayload = {
    design: submittedDesign,
    customerDetails: {
      name: 'M. Shamil (Billing Account Name)',
      email: 'shamil@zenithlabs.io',
      phone: '+91 98888 77777',
      address: 'Plot 42, Technopark Phase 3, Trivandrum'
    },
    customerUser: {
      id: 'cust_shamil_99',
      name: 'Account Holder Shamil'
    }
  };

  const order = StorageEngine.submitPrintOrder(orderPayload);
  assert.ok(order, 'Order must be created successfully');

  // Retrieve profiles
  const profiles = StorageEngine.getProfiles();
  const shamilProfile = profiles.find(p => p.userId === 'cust_shamil_99' || p.slug === 'muhammedshamil');

  assert.ok(shamilProfile, 'Digital profile must be auto-created for customer');
  assert.equal(
    shamilProfile.name,
    'Muhammed Shamil',
    'Profile name MUST match exact name entered on NFC card (Muhammed Shamil), not billing or user account name'
  );
  assert.equal(shamilProfile.role, 'Hardware Systems Architect', 'Role must match front card config');
  assert.equal(shamilProfile.company, 'Zenith Labs', 'Company must match');

  console.log('✓ Test 1 Passed: Exact name "Muhammed Shamil" from NFC card mapped to digital profile with 100% fidelity');
}

// Test 2: No Logo Means No Logo
console.log('\nTest 2: No Logo Means No Logo (Strict Absence Check)');
{
  const designWithoutLogo = {
    id: 'des_nologo_002',
    edition: 'steel',
    front: {
      name: 'Amina Al-Mansoor',
      role: 'Investment Director'
    },
    customerLogo: null,
    frontConfig: { customLogo: null }
  };

  const order = StorageEngine.submitPrintOrder({
    design: designWithoutLogo,
    customerDetails: {
      name: 'Amina Al-Mansoor',
      email: 'amina@gccventures.ae',
      address: 'DIFC Gate Precinct 4, Dubai'
    },
    customerUser: { id: 'cust_amina_02' }
  });

  const profiles = StorageEngine.getProfiles();
  const aminaProfile = profiles.find(p => p.userId === 'cust_amina_02');

  assert.ok(aminaProfile, 'Profile must exist');
  assert.equal(aminaProfile.logo, '', 'Profile logo must be completely empty when no logo was uploaded');
  assert.equal(aminaProfile.avatar, '', 'Profile avatar must NOT be populated with a logo or placeholder');
  assert.ok(!aminaProfile.logo, 'No logo string or object should exist');

  console.log('✓ Test 2 Passed: No logo uploaded strictly results in empty logo with zero placeholder injection');
}

// Test 3: Never Invent Customer Information
console.log('\nTest 3: Never Invent Customer Information');
{
  const minimalDesign = {
    id: 'des_minimal_003',
    edition: 'black',
    front: {
      name: 'David Vance'
      // No company, role, tagline, website, social links
    }
  };

  const order = StorageEngine.submitPrintOrder({
    design: minimalDesign,
    customerDetails: {
      name: 'David Vance',
      email: 'david.vance@independent.org',
      address: '10 Downing St, London'
    },
    customerUser: { id: 'cust_david_03' }
  });

  const profiles = StorageEngine.getProfiles();
  const davidProfile = profiles.find(p => p.userId === 'cust_david_03');

  assert.ok(davidProfile, 'Profile must exist');
  assert.equal(davidProfile.company, '', 'Company must NOT be invented (no "FLOCARDS" or "FLOCARD Network")');
  assert.equal(davidProfile.role, '', 'Role must NOT be invented (no "Executive")');
  assert.equal(davidProfile.bio, '', 'Bio must NOT be invented (no "Connect via my FLOCARD")');
  assert.equal(davidProfile.phone, '', 'Phone must remain empty when not provided');
  assert.equal(davidProfile.whatsapp, '', 'WhatsApp must remain empty when not provided');
  assert.deepEqual(davidProfile.services || [], [], 'Services array must remain empty without fake consulting offerings');
  assert.deepEqual(davidProfile.portfolio || [], [], 'Portfolio array must remain empty without fake showcases');

  console.log('✓ Test 3 Passed: Digital profile displays strictly real info and invents zero fallback data');
}

// Test 4: Complete Customer-Side Editing (Save, Replace, Remove)
console.log('\nTest 4: Complete Customer-Side Editing');
{
  const profiles = StorageEngine.getProfiles();
  const shamilProfile = profiles.find(p => p.name === 'Muhammed Shamil');
  assert.ok(shamilProfile, 'Shamil profile must exist');

  // 4a. Customer adds a business logo and avatar
  const updatedByCustomer = {
    ...shamilProfile,
    logo: 'https://storage.flocard.in/logos/zenith_labs_clean.png',
    avatar: 'https://storage.flocard.in/avatars/shamil_portrait.jpg',
    bio: 'Building low-latency hardware interfaces.',
    phone: '+91 94444 33333',
    whatsapp: '919444433333',
    website: 'https://zenithlabs.io',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/shamil',
      twitter: 'https://x.com/shamil'
    }
  };

  const saved1 = StorageEngine.saveProfile(updatedByCustomer);
  assert.equal(saved1.logo, 'https://storage.flocard.in/logos/zenith_labs_clean.png');
  assert.equal(saved1.avatar, 'https://storage.flocard.in/avatars/shamil_portrait.jpg');
  assert.equal(saved1.bio, 'Building low-latency hardware interfaces.');

  // 4b. Customer removes logo completely
  const removedLogo = {
    ...saved1,
    logo: ''
  };
  const saved2 = StorageEngine.saveProfile(removedLogo);
  assert.equal(saved2.logo, '', 'Customer must be able to remove logo completely');
  assert.equal(saved2.avatar, 'https://storage.flocard.in/avatars/shamil_portrait.jpg', 'Avatar remains intact when logo is removed');

  // 4c. Customer removes avatar completely
  const removedAvatar = {
    ...saved2,
    avatar: ''
  };
  const saved3 = StorageEngine.saveProfile(removedAvatar);
  assert.equal(saved3.avatar, '', 'Customer must be able to remove personal avatar completely');

  console.log('✓ Test 4 Passed: Customer can add, replace, and remove logo & avatar independently');
}

// Test 5: Complete Admin-Side Editing & Persistence
console.log('\nTest 5: Complete Admin-Side Editing');
{
  const profiles = StorageEngine.getProfiles();
  const aminaProfile = profiles.find(p => p.name === 'Amina Al-Mansoor');
  assert.ok(aminaProfile, 'Amina profile exists');

  // Admin updates verified badge & title
  const adminEdited = {
    ...aminaProfile,
    role: 'Senior Managing Director & Venture Partner',
    company: 'GCC Sovereign Ventures',
    theme: 'gold',
    status: 'published'
  };

  const adminSaved = StorageEngine.saveProfile(adminEdited);
  assert.equal(adminSaved.role, 'Senior Managing Director & Venture Partner');
  assert.equal(adminSaved.company, 'GCC Sovereign Ventures');
  assert.equal(adminSaved.theme, 'gold');

  // Reload to verify persistence
  const reloaded = StorageEngine.getProfileBySlug(aminaProfile.slug);
  assert.equal(reloaded.role, 'Senior Managing Director & Venture Partner');
  assert.equal(reloaded.company, 'GCC Sovereign Ventures');

  console.log('✓ Test 5 Passed: Admin editing saves directly with immediate database persistence');
}

// Test 6: Multi-Customer Data Isolation (No Alex Morgan Pollution)
console.log('\nTest 6: Multi-Customer Data Isolation (Zero Alex Morgan Pollution)');
{
  const profiles = StorageEngine.getProfiles();
  const shamil = profiles.find(p => p.name === 'Muhammed Shamil');
  const amina = profiles.find(p => p.name === 'Amina Al-Mansoor');
  const david = profiles.find(p => p.name === 'David Vance');

  assert.ok(shamil && amina && david, 'All three customer profiles must exist independently');

  // Verify Shamil never inherited Alex Morgan's email or phone
  assert.notEqual(shamil.email, 'contact@flocard.in', 'Customer profile must not inherit demo contact email');
  assert.notEqual(shamil.phone, '+91 97782 78552', 'Customer profile must not inherit Alex Morgan phone number');

  // Verify Amina never inherited Alex Morgan's company
  assert.notEqual(amina.company, 'FLOCARDS', 'Amina must not inherit FLOCARDS company name');

  // Verify David never inherited Alex Morgan's avatar
  assert.notEqual(david.avatar, INITIAL_PROFILES[0].avatar, 'David must not inherit stock Unsplash avatar');

  console.log('✓ Test 6 Passed: Complete data isolation across customer profiles with zero leakage from demo profile');
}

// Test 7: Public Profile Slug Resolution & Privacy
console.log('\nTest 7: Public Profile Slug Resolution & Privacy');
{
  // 7a. Non-existent slug returns null
  const unknown = StorageEngine.getProfileBySlug('this-slug-does-not-exist-12345');
  assert.equal(unknown, null, 'Unknown slug must return null and trigger 404 state, not Alex Morgan profile');

  // 7b. Legitimate slug returns correct profile
  const validProfile = StorageEngine.getProfileBySlug('muhammedshamil');
  assert.ok(validProfile, 'Existing customer slug must resolve');
  assert.equal(validProfile.name, 'Muhammed Shamil');

  console.log('✓ Test 7 Passed: Slug resolver accurately differentiates valid customers and rejects unknown slugs');
}

console.log('\n🎉 ALL 7 DIGITAL PROFILE DATA ACCURACY & EDITING TESTS PASSED! 🎉\n');
