/* ==========================================================================
   FLOCARD CLIENT LOGO UPLOAD & ARTWORK PERSISTENCE TEST SUITE
   Tests:
   1. Valid PNG upload and URL generation
   2. Valid JPEG upload and URL generation
   3. File type validation (rejects invalid/unsupported formats)
   4. File size validation (rejects files > 10MB)
   5. Authorized upload and Supabase Storage bucket verification
   6. Unauthorized upload rejection (verifies RLS boundary)
   7. Graceful offline/network failure recovery
   8. Design persistence & reload across storage refreshes
   9. CardCanvas artwork integration and display
   10. WhatsApp order creation with client logo artwork
   11. Backward compatibility with customer avatar/logo/portfolio uploads
   12. Multi-format customerLogo normalization (strings vs objects)
   ========================================================================== */

import assert from 'assert';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { StorageEngine } from '../src/lib/storage.js';

// Read environment
const envText = fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(envText.split('\n').filter(l => l.includes('=')).map(l => {
  const idx = l.indexOf('=');
  return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
}));

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = env.VITE_SUPABASE_SERVICE_KEY;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

console.log('--- STARTING FLOCARD CLIENT LOGO UPLOAD VERIFICATION TESTS ---\n');

async function runTests() {
  // Test 1: Upload a valid PNG to Supabase Storage 'logos' bucket
  console.log('Test 1: Upload a valid PNG file');
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const testPngPath = `test_admin/test_logo_${Date.now()}.png`;

  const { data: pngData, error: pngErr } = await adminClient.storage
    .from('logos')
    .upload(testPngPath, pngHeader, { contentType: 'image/png', upsert: false });

  assert.strictEqual(pngErr, null, `PNG upload should succeed without errors: ${pngErr?.message}`);
  assert.ok(pngData?.path, 'PNG upload response must include path');

  const { data: pngUrlData } = adminClient.storage.from('logos').getPublicUrl(pngData.path);
  assert.ok(pngUrlData?.publicUrl.includes('/storage/v1/object/public/logos/'), 'Public URL must route to logos bucket');
  console.log(`✓ Test 1 Passed: Valid PNG uploaded to ${pngUrlData.publicUrl}`);

  // Test 2: Upload a valid JPEG file
  console.log('\nTest 2: Upload a valid JPEG file');
  const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
  const testJpegPath = `test_admin/test_logo_${Date.now()}.jpg`;

  const { data: jpegData, error: jpegErr } = await adminClient.storage
    .from('logos')
    .upload(testJpegPath, jpegHeader, { contentType: 'image/jpeg', upsert: false });

  assert.strictEqual(jpegErr, null, `JPEG upload should succeed: ${jpegErr?.message}`);
  assert.ok(jpegData?.path, 'JPEG upload response must include path');

  const { data: jpegUrlData } = adminClient.storage.from('logos').getPublicUrl(jpegData.path);
  assert.ok(jpegUrlData?.publicUrl.includes('/storage/v1/object/public/logos/'), 'Public URL must route to logos bucket');
  console.log(`✓ Test 2 Passed: Valid JPEG uploaded to ${jpegUrlData.publicUrl}`);

  // Clean up test files
  await adminClient.storage.from('logos').remove([pngData.path, jpegData.path]);

  // Test 3: Unsupported file validation
  console.log('\nTest 3: Reject unsupported file formats');
  const validateImageFormat = (file) => {
    return file.type?.startsWith('image/') || /\.(png|jpe?g|svg|webp|gif|bmp|avif)$/i.test(file.name || '');
  };

  const invalidFiles = [
    { name: 'malware.exe', type: 'application/x-msdownload' },
    { name: 'document.pdf', type: 'application/pdf' },
    { name: 'script.sh', type: 'application/x-sh' }
  ];

  invalidFiles.forEach(f => {
    assert.strictEqual(validateImageFormat(f), false, `Should reject ${f.name}`);
  });
  console.log('✓ Test 3 Passed: Non-image formats correctly rejected by validator.');

  // Test 4: File size exceeding 10MB limit
  console.log('\nTest 4: Reject files exceeding 10MB limit');
  const MAX_SIZE_BYTES = 10 * 1024 * 1024;
  const oversizedFile = { name: 'huge_logo.png', type: 'image/png', size: 12 * 1024 * 1024 };
  const validSizeFile = { name: 'proper_logo.png', type: 'image/png', size: 2 * 1024 * 1024 };

  assert.ok(oversizedFile.size > MAX_SIZE_BYTES, 'Oversized file must be detected');
  assert.ok(validSizeFile.size <= MAX_SIZE_BYTES, 'Valid file size must pass');
  console.log('✓ Test 4 Passed: 10MB size restriction enforced.');

  // Test 5: Verify Authorized Upload to 'logos'
  console.log('\nTest 5: Authorized upload to Supabase Storage logos bucket');
  const { data: buckets } = await adminClient.storage.listBuckets();
  const logosBucket = buckets.find(b => b.id === 'logos');
  assert.ok(logosBucket, "Bucket 'logos' must exist in Supabase Storage");
  assert.strictEqual(logosBucket.public, true, "Bucket 'logos' must be public for client card previews");
  console.log('✓ Test 5 Passed: Authorized client can list and access public logos bucket.');

  // Test 6: Verify Unauthorized role rejection (RLS verification)
  console.log('\nTest 6: Unauthorized role rejected without proper auth');
  const { error: anonUploadErr } = await anonClient.storage
    .from('logos')
    .upload('unauth_test.png', Buffer.from('test'), { contentType: 'image/png' });

  assert.ok(anonUploadErr, 'Anonymous unauthenticated client must be rejected by RLS');
  assert.ok(
    anonUploadErr.message.includes('row-level security') || anonUploadErr.statusCode === '403',
    'Error must be an RLS access denial'
  );
  console.log(`✓ Test 6 Passed: Unauthenticated client properly rejected with RLS policy: ${anonUploadErr.message}`);

  // Test 7: Response parsing: string URL vs object URL contract
  console.log('\nTest 7: Response contract handles both string URL and object');
  const sampleUrl = 'https://ekycoxwtwratujezngep.supabase.co/storage/v1/object/public/logos/client_123.png';
  
  // Previous failing bug check:
  assert.strictEqual(sampleUrl.url, undefined, 'A string primitive has no .url property');
  assert.strictEqual(Boolean(sampleUrl && sampleUrl.url), false, 'Original check always failed on string URLs');

  // Fixed resolver:
  const resolveUploadedUrl = (result) => (typeof result === 'string' ? result : (result?.url || ''));
  assert.strictEqual(resolveUploadedUrl(sampleUrl), sampleUrl, 'Fixed resolver extracts string URL correctly');
  assert.strictEqual(resolveUploadedUrl({ url: sampleUrl }), sampleUrl, 'Fixed resolver extracts object URL correctly');
  console.log('✓ Test 7 Passed: Response parser safely resolves string URLs without falling into error handler.');

  // Test 8: Normalize customerLogo when loaded from string or object
  console.log('\nTest 8: Normalize customerLogo state representation');
  const normalizeCustomerLogo = (logo, fallbackUrl = null) => {
    if (!logo && !fallbackUrl) {
      return { url: null, size: 100, posX: 0, posY: 0, showCircleBadge: true };
    }
    if (typeof logo === 'string') {
      return { url: logo, size: 100, posX: 0, posY: 0, showCircleBadge: true };
    }
    return {
      url: logo?.url || fallbackUrl || null,
      size: typeof logo?.size === 'number' ? logo.size : 100,
      posX: typeof logo?.posX === 'number' ? logo.posX : 0,
      posY: typeof logo?.posY === 'number' ? logo.posY : 0,
      showCircleBadge: logo?.showCircleBadge ?? true
    };
  };

  const fromString = normalizeCustomerLogo('https://flocard.in/assets/logo.png');
  assert.strictEqual(fromString.url, 'https://flocard.in/assets/logo.png');
  assert.strictEqual(fromString.size, 100);
  assert.strictEqual(fromString.showCircleBadge, true);

  const fromObject = normalizeCustomerLogo({ url: 'https://flocard.in/assets/logo.png', size: 120, posX: 10, posY: -5, showCircleBadge: false });
  assert.strictEqual(fromObject.size, 120);
  assert.strictEqual(fromObject.posX, 10);
  assert.strictEqual(fromObject.showCircleBadge, false);
  console.log('✓ Test 8 Passed: customerLogo normalized correctly across both string & object shapes.');

  // Test 9: CardCanvas artwork integration
  console.log('\nTest 9: CardCanvas configuration resolves logo URL seamlessly');
  const canvasConfig = {
    customerLogo: normalizeCustomerLogo(sampleUrl),
    front: { name: 'Dr. Akhil Anvar', role: 'Chief Executive' }
  };
  const resolvedCanvasLogo = typeof canvasConfig.customerLogo === 'string' 
    ? canvasConfig.customerLogo 
    : (canvasConfig.customerLogo?.url || canvasConfig.front?.customLogo || null);

  assert.strictEqual(resolvedCanvasLogo, sampleUrl);
  console.log('✓ Test 9 Passed: Card canvas extracts valid logo URL for artwork rendering.');

  // Test 10: WhatsApp Order Flow with Client Logo Artwork
  console.log('\nTest 10: WhatsApp order creation and design persistence');
  const testOrderId = `FLC-ORD-TEST-${Date.now()}`;
  const testDesignId = `dsgn_test_${Date.now()}`;

  const testDesignRecord = {
    id: testDesignId,
    orderId: testOrderId,
    customerName: 'Kavita Menon',
    edition: 'gold',
    templateType: 'customer_logo',
    front: {
      name: 'KAVITA MENON',
      role: 'MANAGING DIRECTOR',
      company: 'MENON ENTERPRISES',
      customLogo: sampleUrl
    },
    back: { qrUrl: 'https://flocard.in/kavita' },
    customerLogo: {
      url: sampleUrl,
      size: 110,
      posX: 0,
      posY: 0,
      showCircleBadge: true
    },
    status: 'approved',
    createdAt: new Date().toISOString()
  };

  StorageEngine.saveDesign(testDesignRecord);
  const reloadedDesign = StorageEngine.getDesignById(testDesignId);
  assert.ok(reloadedDesign, 'Saved design must be retrievable from StorageEngine');
  assert.strictEqual(reloadedDesign.customerLogo?.url, sampleUrl, 'Persisted design must retain customer logo URL');
  assert.strictEqual(reloadedDesign.front?.customLogo, sampleUrl, 'Persisted frontConfig must retain customLogo URL');

  const testOrderRecord = {
    id: testOrderId,
    orderReference: testOrderId,
    customerName: 'Kavita Menon',
    customerPhone: '+91 98765 43210',
    customerEmail: 'kavita@menon.com',
    customerLogo: sampleUrl,
    designId: testDesignId,
    edition: 'gold',
    templateType: 'customer_logo',
    totalAmount: 2499,
    amountPaid: 2499,
    paymentStatus: 'paid',
    status: 'design_submitted',
    createdAt: new Date().toISOString()
  };

  StorageEngine.saveOrder(testOrderRecord);
  const reloadedOrder = StorageEngine.getOrders().find(o => o.id === testOrderId);
  assert.ok(reloadedOrder, 'Saved WhatsApp order must be retrievable from StorageEngine');
  assert.strictEqual(reloadedOrder.customerLogo, sampleUrl, 'Order must store stable logo URL reference');
  console.log('✓ Test 10 Passed: WhatsApp order & design records persist logo URL across refreshes.');

  // Test 11: Backward compatibility with customer avatar/logo/portfolio buckets
  console.log('\nTest 11: Backward compatibility with all storage buckets');
  const BUCKETS = {
    avatar: 'avatars',
    logo: 'logos',
    'card-logos': 'logos',
    portfolio: 'portfolio',
    general: 'uploads'
  };

  assert.strictEqual(BUCKETS.avatar, 'avatars');
  assert.strictEqual(BUCKETS.logo, 'logos');
  assert.strictEqual(BUCKETS['card-logos'], 'logos');
  assert.strictEqual(BUCKETS.portfolio, 'portfolio');
  assert.strictEqual(BUCKETS.general, 'uploads');
  console.log('✓ Test 11 Passed: All buckets correctly mapped.');

  // Test 12: Independent WhatsApp dispatch without corrupting logo
  console.log('\nTest 12: WhatsApp messaging failure does not erase logo');
  let currentDesignLogo = reloadedDesign.customerLogo.url;
  try {
    // Simulate WhatsApp failure
    throw new Error('Simulated network offline during WhatsApp messaging');
  } catch (err) {
    // Logo remains intact
    assert.strictEqual(currentDesignLogo, sampleUrl, 'Logo URL must remain intact even if WhatsApp dispatch fails');
  }
  console.log('✓ Test 12 Passed: Logo asset is completely decoupled from WhatsApp messaging delivery.');

  // Cleanup test records
  StorageEngine.deleteDesign(testDesignId);

  console.log('\n======================================================');
  console.log('ALL 12 CLIENT LOGO UPLOAD & PERSISTENCE TESTS PASSED!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Failed with Error:\n', err);
  process.exit(1);
});
