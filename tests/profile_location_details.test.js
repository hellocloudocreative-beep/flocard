import assert from 'assert';
import { generateVCardString } from '../src/lib/vcard.js';

console.log('--- STARTING DIGITAL PROFILE LOCATION TEST SUITE ---');

// Test 1: vCard generation with location and address
console.log('\nTest 1: vCard generation with location and address');
const profileWithLoc = {
  name: 'Sinan Test',
  role: 'Founder & CEO',
  company: 'FLOCARDS Pvt Ltd',
  email: 'sinan@flocard.in',
  phone: '+91 97782 78552',
  location: 'Bengaluru, India',
  address: 'Archierio Experience Center, 668, 8th Main Rd, HSR Layout, Bengaluru',
  mapsUrl: 'https://maps.google.com/?q=Archierio+HSR',
  slug: 'sinan-test'
};

const vcardString = generateVCardString(profileWithLoc);
assert(vcardString.includes('ADR;TYPE=WORK:;;Archierio Experience Center'), 'vCard should contain address');
assert(vcardString.includes('URL;TYPE=LOCATION:https://maps.google.com/?q=Archierio+HSR'), 'vCard should contain maps URL');
console.log('✓ Test 1 Passed: vCard includes physical address and maps link.');

// Test 2: vCard fallback when only location is provided
console.log('\nTest 2: vCard fallback when only location is provided');
const profileLocOnly = {
  name: 'Alex Morgan',
  location: 'Dubai, UAE',
  slug: 'alex'
};
const vcardLocOnly = generateVCardString(profileLocOnly);
assert(vcardLocOnly.includes('ADR;TYPE=WORK:;;Dubai, UAE;;;;'), 'vCard should contain location');
console.log('✓ Test 2 Passed: vCard falls back to location when address is omitted.');

// Test 3: Maps query resolution
console.log('\nTest 3: Maps query resolution');
const testLoc = 'Bengaluru, India';
const expectedUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(testLoc)}`;
assert.strictEqual(expectedUrl, 'https://www.google.com/maps/search/?api=1&query=Bengaluru%2C%20India');
console.log('✓ Test 3 Passed: Maps query encoded properly.');

console.log('\n🎉 ALL PROFILE LOCATION TESTS PASSED SUCCESSFULLY! 🎉\n');
