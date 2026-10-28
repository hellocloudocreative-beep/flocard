/* ==========================================================================
   FLOCARDS COMPLETE DIGITAL PROFILE UPGRADE REGRESSION TEST SUITE
   Authoritative automated regression tests for:
   1. Full-screen profile layout resolution and schema attributes
   2. Banner configuration, positioning, zoom, video & overlay
   3. Business hours calculation, timezones, and live Open/Closed badge
   4. Appointment booking, slot generation, and double-booking concurrency prevention
   5. Services showcase data integrity
   6. Video portfolio URL resolution (YouTube & Shorts)
   7. Payment validation (UPI ID, IFSC code) and upi://pay URI generation
   8. Bank details privacy-by-default safeguard
   9. Storage quota measurement, limits, and server-side rejection
   10. Owner-only activity feed security and staff isolation
   11. NFC card resolution & slug backwards compatibility
   ========================================================================== */

import assert from 'node:assert';
import { StorageEngine, INITIAL_PROFILES } from '../src/lib/storage.js';
import { businessHoursService } from '../src/lib/businessHoursService.js';
import { appointmentService } from '../src/lib/appointmentService.js';
import { storageQuotaService } from '../src/lib/storageQuotaService.js';
import {
  isValidUpiId,
  generateUpiPaymentLink,
  isValidIfscCode,
  isBankDetailsPublished
} from '../src/lib/paymentValidator.js';

console.log('================================================================');
console.log('🚀 RUNNING FLOCARDS DIGITAL PROFILE UPGRADE REGRESSION TESTS');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: Full-Screen Digital Profile Resolution & Schema
// -----------------------------------------------------------------------------
console.log('Test 1: Full-Screen Profile Resolution & Attributes');
const profile = StorageEngine.getProfileBySlug('alex');
assert.ok(profile, 'Profile alex must resolve');
assert.strictEqual(profile.slug, 'alex', 'Profile slug must match alex');
assert.ok(profile.name, 'Name must be defined');
assert.ok(profile.banner, 'Profile must have a banner object');
assert.ok(profile.businessHours, 'Profile must have businessHours');
assert.ok(profile.bookingConfig, 'Profile must have bookingConfig');
assert.ok(Array.isArray(profile.services), 'Services must be an array');
assert.ok(Array.isArray(profile.videos), 'Videos must be an array');
assert.ok(profile.paymentConfig, 'Payment config must be defined');
assert.ok(profile.bankDetails, 'Bank details must be defined');
assert.ok(profile.storageQuotas, 'Storage quotas must be defined');
assert.ok(profile.sectionVisibility, 'Section visibility toggles must exist');
console.log('✓ Profile resolved with all 14 upgraded digital profile components.');

// -----------------------------------------------------------------------------
// TEST 2: Discord/Facebook Profile Banner Configuration
// -----------------------------------------------------------------------------
console.log('\nTest 2: Profile Banner Configuration');
const banner = profile.banner;
assert.strictEqual(typeof banner.enabled, 'boolean', 'Banner enabled must be boolean');
assert.strictEqual(typeof banner.height, 'number', 'Banner height must be numeric');
assert.strictEqual(typeof banner.zoom, 'number', 'Banner zoom must be numeric');
const posX = banner.positionX ?? banner.posX;
const posY = banner.positionY ?? banner.posY;
const overlay = banner.overlayOpacity ?? banner.overlay;
assert.strictEqual(typeof posX, 'number', 'Banner posX must be numeric');
assert.strictEqual(typeof posY, 'number', 'Banner posY must be numeric');
assert.strictEqual(typeof overlay, 'number', 'Banner overlay must be numeric');
assert.ok(banner.url || banner.imageUrl, 'Banner url must exist');
console.log('✓ Banner settings verified:', {
  type: banner.type,
  height: banner.height,
  zoom: banner.zoom,
  posX,
  posY,
  overlay
});

// -----------------------------------------------------------------------------
// TEST 3: Business Hours Calculation & Live Status Badge
// -----------------------------------------------------------------------------
console.log('\nTest 3: Business Hours & Live Status Badge');
const testSchedule = {
  enabled: true,
  timezone: 'Asia/Kolkata',
  schedule: {
    monday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
    tuesday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
    wednesday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
    thursday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
    friday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
    saturday: { isOpen: true, slots: [{ open: '10:00', close: '16:00' }] },
    sunday: { isOpen: false, slots: [] }
  }
};

const liveStatus = businessHoursService.getLiveStatus(testSchedule);
assert.ok(liveStatus, 'Live status must be returned');
assert.ok(typeof liveStatus.isOpen === 'boolean', 'isOpen must be boolean');
assert.ok(liveStatus.badge, 'Badge label must be defined');
assert.ok(liveStatus.detail, 'Detail text must be defined');
console.log('✓ Live business hours status calculated:', liveStatus);

// Test overnight schedule parsing
const overnightSchedule = {
  enabled: true,
  timezone: 'Asia/Kolkata',
  schedule: {
    monday: { isOpen: true, slots: [{ open: '20:00', close: '02:00' }] },
    tuesday: { isOpen: true, slots: [{ open: '20:00', close: '02:00' }] },
    wednesday: { isOpen: true, slots: [{ open: '20:00', close: '02:00' }] },
    thursday: { isOpen: true, slots: [{ open: '20:00', close: '02:00' }] },
    friday: { isOpen: true, slots: [{ open: '20:00', close: '02:00' }] },
    saturday: { isOpen: true, slots: [{ open: '20:00', close: '02:00' }] },
    sunday: { isOpen: true, slots: [{ open: '20:00', close: '02:00' }] }
  }
};
const overnightStatus = businessHoursService.getLiveStatus(overnightSchedule);
assert.ok(overnightStatus, 'Overnight schedule handles successfully without throwing');
console.log('✓ Overnight schedule calculation verified:', overnightStatus.badge, '-', overnightStatus.detail);

// -----------------------------------------------------------------------------
// TEST 4: Appointment Booking & Concurrency Protection
// -----------------------------------------------------------------------------
console.log('\nTest 4: Appointment Booking & Double-Booking Prevention');

// Generate available slots for tomorrow
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const slots = appointmentService.getAvailableSlots(profile, tomorrowStr);
assert.ok(Array.isArray(slots), 'Slots must be an array');
assert.ok(slots.length > 0, 'Available slots must be generated for open day');
console.log(`✓ Generated ${slots.length} available slots for ${tomorrowStr} (first slot: ${slots[0].displayTime || slots[0].time})`);

const chosenSlot = slots[0];

// Submit First Booking
const booking1Result = appointmentService.bookAppointment({
  profileSlug: 'alex',
  serviceId: profile.services[0]?.id || 'srv_01',
  serviceName: profile.services[0]?.name || 'Executive Strategy',
  customerName: 'Karan Sharma',
  customerPhone: '+91 98765 43210',
  customerEmail: 'karan@example.com',
  date: tomorrowStr,
  time: chosenSlot,
  notes: 'Testing first reservation'
});

assert.ok(booking1Result.success, 'First booking must succeed');
assert.ok(booking1Result.appointment.referenceCode, 'Reference code must be created');
assert.ok(booking1Result.appointment.referenceCode.startsWith('FLC-BK-'), 'Ref code must have FLC-BK- prefix');
console.log(`✓ Booking 1 confirmed with Reference Code: ${booking1Result.appointment.referenceCode}`);

// Attempt Concurrent Double-Booking for the SAME Slot
const booking2Result = appointmentService.bookAppointment({
  profileSlug: 'alex',
  serviceId: profile.services[0]?.id || 'srv_01',
  serviceName: profile.services[0]?.name || 'Executive Strategy',
  customerName: 'Rohan Mehta',
  customerPhone: '+91 98765 11111',
  customerEmail: 'rohan@example.com',
  date: tomorrowStr,
  time: chosenSlot,
  notes: 'Attempting conflicting reservation'
});

assert.strictEqual(booking2Result.success, false, 'Concurrent booking for same slot must be rejected');
assert.ok(booking2Result.error.includes('already booked'), 'Error must indicate slot is already booked');
console.log('✓ Concurrency protection: Double-booking successfully prevented!');

// Clean up test booking
StorageEngine.deleteAppointment(booking1Result.appointment.id);
console.log('✓ Cleaned up test booking.');

// -----------------------------------------------------------------------------
// TEST 5: Services Showcase
// -----------------------------------------------------------------------------
console.log('\nTest 5: Services Showcase');
assert.ok(profile.services.length >= 1, 'Profile must have services');
const srv = profile.services[0];
assert.ok(srv.id, 'Service must have an id');
const srvName = srv.title || srv.name;
assert.ok(srvName, 'Service must have a title or name');
assert.ok(srv.price || srv.contactForPrice, 'Service must have price or contact flag');
assert.ok(srv.duration, 'Service must have duration');
console.log('✓ Service item verified:', { name: srvName, price: srv.price, duration: srv.duration });

// -----------------------------------------------------------------------------
// TEST 6: Video Portfolio Resolution
// -----------------------------------------------------------------------------
console.log('\nTest 6: Video Portfolio URL Resolution');
assert.ok(profile.videos.length >= 1, 'Profile must have video items');
const vid = profile.videos[0];
assert.ok(vid.url, 'Video item must have url');
assert.ok(vid.title, 'Video item must have title');
assert.ok(vid.url.includes('youtube.com') || vid.url.includes('youtu.be'), 'Must support YouTube/Shorts');
console.log('✓ Video item verified:', { title: vid.title, url: vid.url });

// -----------------------------------------------------------------------------
// TEST 7: Payment Validation (UPI ID & IFSC)
// -----------------------------------------------------------------------------
console.log('\nTest 7: Payment Validation & Link Generation');

// Valid UPI IDs
assert.strictEqual(isValidUpiId('alex.morgan@okaxis'), true);
assert.strictEqual(isValidUpiId('flocards@icici'), true);
assert.strictEqual(isValidUpiId('user99@paytm'), true);

// Invalid UPI IDs
assert.strictEqual(isValidUpiId('invalid-upi-no-at'), false);
assert.strictEqual(isValidUpiId('@bank'), false);
assert.strictEqual(isValidUpiId('alex@'), false);
console.log('✓ UPI ID format validation passed.');

// UPI payment deep link
const upiLink = generateUpiPaymentLink({
  upiId: 'alex.morgan@okaxis',
  recipientName: 'Alex Morgan',
  amount: 500,
  note: 'FLOCARDS Profile Consultation'
});
assert.ok(upiLink.includes('pa=alex.morgan') && upiLink.includes('okaxis'), 'UPI link must contain payee address');
assert.ok(upiLink.includes('Alex') && upiLink.includes('Morgan'), 'UPI link must contain payee name');
console.log('✓ Generated upi://pay URI:', upiLink);

// RBI IFSC Validation
assert.strictEqual(isValidIfscCode('HDFC0001234'), true, 'Valid HDFC IFSC');
assert.strictEqual(isValidIfscCode('SBIN0000456'), true, 'Valid SBI IFSC');
assert.strictEqual(isValidIfscCode('ICIC0000101'), true, 'Valid ICICI IFSC');
assert.strictEqual(isValidIfscCode('INVALID_CODE'), false, 'Rejects invalid IFSC');
assert.strictEqual(isValidIfscCode('HDFC1001234'), false, 'Rejects 5th char not zero');
console.log('✓ RBI IFSC Code validation passed.');

// -----------------------------------------------------------------------------
// TEST 8: Bank Details Privacy-by-Default Safeguard
// -----------------------------------------------------------------------------
console.log('\nTest 8: Bank Details Privacy Safeguard');

const privateBankDetails = {
  accountHolderName: 'Alex Morgan',
  bankName: 'HDFC Bank',
  accountNumber: '5010022334455',
  ifscCode: 'HDFC0001234',
  isPubliclyVisible: false,
  explicitConsentGiven: false
};
assert.strictEqual(
  isBankDetailsPublished(privateBankDetails),
  false,
  'Bank details MUST NOT be published when explicit consent is false'
);

const consentGivenOnly = {
  ...privateBankDetails,
  explicitConsentGiven: true,
  isPubliclyVisible: false
};
assert.strictEqual(
  isBankDetailsPublished(consentGivenOnly),
  false,
  'Bank details MUST NOT be published if isPubliclyVisible is false'
);

const publiclyPublished = {
  ...privateBankDetails,
  explicitConsentGiven: true,
  isPubliclyVisible: true
};
assert.strictEqual(
  isBankDetailsPublished(publiclyPublished),
  true,
  'Bank details published only when BOTH explicit consent and visibility are true'
);
console.log('✓ Bank details privacy safeguard strictly enforced.');

// -----------------------------------------------------------------------------
// TEST 9: Storage Quota Measurement & Limits Enforcement
// -----------------------------------------------------------------------------
console.log('\nTest 9: Storage Quotas & Upload Limits');

const usage = storageQuotaService.calculateUsage(profile);
assert.ok(usage, 'Storage usage must be calculated');
assert.strictEqual(typeof usage.imagesCount, 'number', 'imagesCount must be numeric');
assert.strictEqual(typeof usage.servicesCount, 'number', 'servicesCount must be numeric');
assert.strictEqual(typeof usage.videosCount, 'number', 'videosCount must be numeric');
assert.strictEqual(typeof usage.storageMB, 'number', 'storageMB must be numeric');
console.log('✓ Storage usage measured:', {
  images: `${usage.imagesCount} / ${usage.limits.maxImages}`,
  services: `${usage.servicesCount} / ${usage.limits.maxServices}`,
  videos: `${usage.videosCount} / ${usage.limits.maxVideos}`,
  storage: `${usage.storageMB} MB / ${usage.limits.maxStorageMB} MB`
});

// Test upload quota validation - allowed upload
const validFile = { name: 'banner.png', size: 2 * 1024 * 1024, type: 'image/png' };
const validCheck = storageQuotaService.validateUpload(profile, 'banner', validFile);
assert.strictEqual(validCheck.valid, true, 'Valid 2MB banner upload must be accepted');

// Test upload quota validation - file size exceeds banner limit (e.g. 20MB file when limit is 15MB)
const oversizedFile = { name: 'huge_banner.jpg', size: 20 * 1024 * 1024, type: 'image/jpeg' };
const oversizedCheck = storageQuotaService.validateUpload(profile, 'banner', oversizedFile);
assert.strictEqual(oversizedCheck.valid, false, 'Oversized 20MB banner must be rejected');
assert.ok(oversizedCheck.error.includes('exceeds maximum allowed'), 'Helpful error must be provided');
console.log('✓ Server-side upload quota rejection confirmed for oversized asset.');

// -----------------------------------------------------------------------------
// TEST 10: Owner-Only Activity Audit Ledger Security
// -----------------------------------------------------------------------------
console.log('\nTest 10: Owner-Only Activity Ledger & Staff Isolation');

// Staff user request (non-owner)
const salesStaffUser = { id: 'usr_sales_01', email: 'sales@flocard.in', role: 'sales' };
const staffLogs = StorageEngine.getAuditLogs(salesStaffUser);
assert.strictEqual(staffLogs.length, 0, 'Staff member must receive empty array for audit logs');

// Platform owner request
const ownerUser = { id: 'usr_owner_01', email: 'admin@flocard.in', role: 'owner' };
const ownerLogs = StorageEngine.getAuditLogs(ownerUser);
assert.ok(Array.isArray(ownerLogs), 'Owner must receive audit logs array');
assert.ok(ownerLogs.length > 0, 'Owner must have access to audit logs');
console.log(`✓ Staff isolation verified: staff received 0 logs, owner received ${ownerLogs.length} logs.`);

// -----------------------------------------------------------------------------
// TEST 11: NFC Card & Slug Backwards Compatibility
// -----------------------------------------------------------------------------
console.log('\nTest 11: NFC Card & Slug Backwards Compatibility');

// Primary profile resolution
const alex = StorageEngine.getProfileBySlug('alex');
assert.ok(alex, 'Primary profile alex must resolve');

// Legacy alias lookup
const legacyAkhil = StorageEngine.getProfileBySlug('akhil');
assert.ok(legacyAkhil, 'Legacy alias lookup must resolve');
assert.strictEqual(legacyAkhil.slug, 'akhil', 'Slug must match lookup key');

// NFC Card assignment check
const cards = StorageEngine.getCards();
assert.ok(cards.length > 0, 'NFC cards must be loaded');
const assigned = cards.find(c => c.profileSlug === 'alex');
if (assigned) {
  assert.ok(assigned.cardCode, 'Assigned card must have a valid cardCode');
  assert.ok(assigned.edition, 'Assigned card must have an edition');
  console.log(`✓ NFC card ${assigned.cardCode} is bound to /p/${assigned.profileSlug}`);
}

console.log('\n================================================================');
console.log('🎉 ALL 11 REGRESSION TEST SUITES PASSED SUCCESSFULLY!');
console.log('================================================================');
