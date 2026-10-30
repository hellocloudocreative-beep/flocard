import assert from 'assert';
import { generateVCardString } from '../src/lib/vcard.js';
import { resolveMapUrl } from '../src/lib/constants.js';

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
assert(vcardLocOnly.includes('URL;TYPE=LOCATION:https://www.google.com/maps/search/?api=1&query=Dubai%2C%20UAE'), 'vCard should auto-generate maps link for location');
console.log('✓ Test 2 Passed: vCard falls back to location and auto-generates map link.');

// Test 3: resolveMapUrl resolution across different formats
console.log('\nTest 3: resolveMapUrl resolution across different formats');
// 3a: Explicit URL
assert.strictEqual(
  resolveMapUrl({ mapsUrl: 'https://maps.app.goo.gl/xyz123' }),
  'https://maps.app.goo.gl/xyz123'
);
// 3b: Bare URL without protocol
assert.strictEqual(
  resolveMapUrl({ mapsUrl: 'maps.google.com/?q=HSR+Layout' }),
  'https://maps.google.com/?q=HSR+Layout'
);
// 3c: Address + Location combined
assert.strictEqual(
  resolveMapUrl({ location: 'Bengaluru, India', address: 'Archierio Center, HSR Layout' }),
  'https://www.google.com/maps/search/?api=1&query=Archierio%20Center%2C%20HSR%20Layout%2C%20Bengaluru%2C%20India'
);
// 3d: Empty object
assert.strictEqual(resolveMapUrl({}), null);
console.log('✓ Test 3 Passed: resolveMapUrl accurately handles explicit URLs, bare protocols, and address queries.');

console.log('\n🎉 ALL PROFILE LOCATION TESTS PASSED SUCCESSFULLY! 🎉\n');
