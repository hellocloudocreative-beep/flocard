/* ==========================================================================
   FLOCARD AI CONCIERGE API TEST SUITE
   Validates server-side AI endpoint, security, validation, and honest error handling.
   ========================================================================== */

import assert from 'assert';

console.log('--- STARTING AI CONCIERGE API TESTS ---\n');

const BASE_URL = 'http://localhost:5173';

async function runTests() {
  // 1. GET /api/ai-concierge/status
  console.log('Test 1: Status Endpoint');
  const statusRes = await fetch(`${BASE_URL}/api/ai-concierge/status`);
  assert.strictEqual(statusRes.status, 200);
  const statusData = await statusRes.json();
  console.log('Status result:', statusData);
  assert.strictEqual(typeof statusData.configured, 'boolean');
  console.log('✓ Status endpoint verified.');

  // 2. POST /api/ai-concierge with missing message payload
  console.log('\nTest 2: Validation on missing message');
  const invalidRes = await fetch(`${BASE_URL}/api/ai-concierge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.strictEqual(invalidRes.status, 400);
  const invalidData = await invalidRes.json();
  assert.ok(invalidData.error.includes('Missing required message'));
  console.log('✓ Payload validation verified: rejected empty message with 400.');

  // 3. POST /api/ai-concierge honest setup response when unconfigured
  console.log('\nTest 3: Honest setup response when no provider is configured');
  const chatRes = await fetch(`${BASE_URL}/api/ai-concierge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Recommend me a card' })
  });
  const chatData = await chatRes.json();
  if (!statusData.configured) {
    assert.strictEqual(chatRes.status, 200);
    assert.strictEqual(chatData.configured, false);
    assert.ok(Array.isArray(chatData.setupInstructions));
    console.log('✓ Unconfigured provider returns clear instructions and never simulates fake AI.');
  } else {
    assert.strictEqual(chatRes.status, 200);
    assert.strictEqual(chatData.success, true);
    console.log('✓ Live AI provider responded successfully.');
  }

  console.log('\n========================================');
  console.log('ALL AI CONCIERGE API TESTS PASSED!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
