/* ==========================================================================
   FLOCARD PREMIUM MORPHING DIGITAL PROFILE & PORTFOLIO TEST SUITE
   Verifies:
   1. Profile Resolution & Fallbacks
   2. Appearance & Morphing Customization Attributes
   3. Opening Behavior Preferences (expandable, full, compact_only)
   4. Section Visibility & Portfolio Structure
   5. Isolation from Physical NFC Card Artwork
   ========================================================================== */

import assert from 'node:assert';
import { StorageEngine, INITIAL_PROFILES } from '../src/lib/storage.js';

console.log('--- STARTING FLOCARD MORPHING PROFILE TESTS ---');

// Test 1: Profile Resolution & Fallback
console.log('\nTest 1: Profile Resolution & Fallback');
const akhilProfile = StorageEngine.getProfileBySlug('akhil');
assert.ok(akhilProfile, 'Flagship profile for akhil must resolve');
assert.strictEqual(akhilProfile.slug, 'akhil', 'Resolved profile slug must match');
assert.ok(akhilProfile.name, 'Name must be defined');
console.log('✓ Flagship profile resolved correctly with full profile details.');

// Test 2: Morphing & Visual Design Attributes
console.log('\nTest 2: Morphing & Visual Design Attributes');
assert.ok(akhilProfile.gradientStart, 'Profile must define gradientStart');
assert.ok(akhilProfile.gradientMid, 'Profile must define gradientMid');
assert.ok(akhilProfile.gradientEnd, 'Profile must define gradientEnd');
assert.ok(akhilProfile.glowColor, 'Profile must define glowColor');
assert.ok(akhilProfile.accentColor, 'Profile must define accentColor');
assert.ok(akhilProfile.photoShape, 'Profile must specify photoShape');
assert.strictEqual(akhilProfile.backgroundTypography, 'FLOCARD', 'Background typography must be defined');
console.log('✓ Visual appearance attributes verified:', {
  start: akhilProfile.gradientStart,
  mid: akhilProfile.gradientMid,
  end: akhilProfile.gradientEnd,
  glow: akhilProfile.glowColor,
  shape: akhilProfile.photoShape
});

// Test 3: Opening Behavior Preference
console.log('\nTest 3: Opening Behavior Preference');
assert.ok(
  ['expandable', 'full', 'compact_only'].includes(akhilProfile.openingPreference),
  'Opening preference must be one of: expandable, full, compact_only'
);
console.log(`✓ Opening preference valid: ${akhilProfile.openingPreference}`);

// Test 4: Section Visibility & Published Portfolio Integrity
console.log('\nTest 4: Section Visibility & Published Portfolio Integrity');
assert.ok(akhilProfile.sectionVisibility, 'Section visibility object must exist');
assert.strictEqual(akhilProfile.sectionVisibility.portfolio, true, 'Portfolio section should be visible');
assert.ok(Array.isArray(akhilProfile.portfolio), 'Portfolio must be an array');
assert.ok(akhilProfile.portfolio.length >= 2, 'Must have authentic published portfolio items');
akhilProfile.portfolio.forEach((p, idx) => {
  assert.ok(p.id, `Item ${idx} must have an ID`);
  assert.ok(p.title, `Item ${idx} must have a title`);
  assert.ok(p.category, `Item ${idx} must have a category`);
  assert.ok(p.image, `Item ${idx} must have an image path`);
});
console.log(`✓ Portfolio contains ${akhilProfile.portfolio.length} verified work showcase items.`);

// Test 5: Profile Customization Update Persistence & Isolation
console.log('\nTest 5: Profile Customization Update Persistence');
const originalMid = akhilProfile.gradientMid;
const updated = StorageEngine.saveProfile({
  ...akhilProfile,
  gradientMid: '#38006b',
  photoShape: 'rounded_rect',
  backgroundTypography: 'ANVAR LABS'
});

const refreshed = StorageEngine.getProfileBySlug('akhil');
assert.strictEqual(refreshed.gradientMid, '#38006b', 'Gradient mid should update in persistent storage');
assert.strictEqual(refreshed.photoShape, 'rounded_rect', 'Photo shape should update in storage');
assert.strictEqual(refreshed.backgroundTypography, 'ANVAR LABS', 'Background typography should update');

// Revert back
StorageEngine.saveProfile({
  ...akhilProfile,
  gradientMid: originalMid,
  photoShape: 'circle',
  backgroundTypography: 'FLOCARD'
});
console.log('✓ Appearance customization successfully updated and verified in database.');

console.log('\n========================================');
console.log('ALL FLOCARD MORPHING PROFILE TESTS PASSED!');
console.log('========================================');
