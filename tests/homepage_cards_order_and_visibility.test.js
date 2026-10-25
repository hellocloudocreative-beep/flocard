/**
 * Comprehensive Acceptance Test Suite for:
 * 1. Admin Card/Edition Visibility (Active vs Disabled)
 *    - When disabled by admin, card must NOT show in Home page, Collection, or Designer swatches.
 * 2. Admin Home Page Card Arrangement (1st, 2nd, etc.)
 *    - Admin can reorder cards to arrange 1st, 2nd, etc. Home page and collections must respect exact displayOrder.
 * 3. Security & Validation
 *    - Only admin/owner can reorder or toggle status.
 */

import { StorageEngine, INITIAL_PRODUCTS } from '../src/lib/storage.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING: Home Page Cards Order & Visibility Tests');
  console.log('====================================================\n');

  // Clear products storage before test
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }

  // TEST 1: Initial Products have default status and displayOrder
  console.log('--- TEST 1: Initial Products Default Order and Status ---');
  const initial = StorageEngine.getProducts();
  assert(Array.isArray(initial) && initial.length === 5, 'Should load 5 default products');
  assert(initial[0].displayOrder === 1, 'First product should have displayOrder: 1');
  assert(initial[0].status === 'active' && initial[0].isActive === true, 'First product should be active');
  assert(initial.every(p => p.status === 'active'), 'All products should be active initially');
  
  // Verify order is 1, 2, 3, 4, 5
  const orders = initial.map(p => p.displayOrder);
  assert(JSON.stringify(orders) === JSON.stringify([1, 2, 3, 4, 5]), 'Initial display orders are 1, 2, 3, 4, 5');

  // TEST 2: Disabling a Card Product as Admin
  console.log('\n--- TEST 2: Disabling a Card Product as Admin ---');
  // Disable the 2nd card ('purple')
  const disableRes = StorageEngine.toggleProductStatus('purple', 'disabled', 'admin', 'admin@flocard.in');
  assert(disableRes.success === true, 'toggleProductStatus should succeed for admin');
  
  const updatedProducts = StorageEngine.getProducts();
  const purpleCard = updatedProducts.find(p => p.editionKey === 'purple');
  assert(purpleCard.status === 'disabled' && purpleCard.isActive === false, 'Purple card should have status: disabled and isActive: false');

  // Active filter simulating Home Page and Customer View
  const homeVisibleCards = updatedProducts.filter(p => p.status !== 'disabled' && p.isActive !== false);
  assert(homeVisibleCards.length === 4, 'Home page visible cards should be 4 (excluding purple)');
  assert(!homeVisibleCards.some(p => p.editionKey === 'purple'), 'Purple card must NOT appear in homeVisibleCards');

  // TEST 3: Unauthorized user cannot toggle product status
  console.log('\n--- TEST 3: Role Authorization for Visibility Toggle ---');
  const unauthRes = StorageEngine.toggleProductStatus('gold', 'disabled', 'customer', 'user@example.com');
  assert(unauthRes.success === false, 'Customer cannot toggle product status');
  const goldCard = StorageEngine.getProducts().find(p => p.editionKey === 'gold');
  assert(goldCard.status === 'active', 'Gold card status remains active');

  // TEST 4: Re-enabling the Disabled Card
  console.log('\n--- TEST 4: Re-enabling the Card Product ---');
  const enableRes = StorageEngine.toggleProductStatus('purple', 'active', 'owner', 'owner@flocard.in');
  assert(enableRes.success === true, 'toggleProductStatus to active should succeed for owner');
  const restoredProducts = StorageEngine.getProducts();
  const restoredPurple = restoredProducts.find(p => p.editionKey === 'purple');
  assert(restoredPurple.status === 'active' && restoredPurple.isActive === true, 'Purple card is active again');
  const allHomeCards = restoredProducts.filter(p => p.status !== 'disabled' && p.isActive !== false);
  assert(allHomeCards.length === 5, 'All 5 cards are once again visible to users');

  // TEST 5: Arranging Cards Order (Reordering 1st, 2nd, etc.)
  console.log('\n--- TEST 5: Reordering Cards for Home Page Arrangement ---');
  // Let's arrange so 'metal' is 1st, 'gold' is 2nd, 'platinum' is 3rd, 'purple' is 4th, 'white' is 5th
  const newOrder = ['metal', 'gold', 'platinum', 'purple', 'white'];
  const reorderRes = StorageEngine.reorderProducts(newOrder, 'admin', 'admin@flocard.in');
  assert(reorderRes.success === true, 'reorderProducts should succeed');
  
  const reorderedProducts = StorageEngine.getProducts();
  assert(reorderedProducts[0].editionKey === 'metal', 'Metal is now 1st card on Home Page (displayOrder: 1)');
  assert(reorderedProducts[0].displayOrder === 1, 'Metal displayOrder is 1');
  assert(reorderedProducts[1].editionKey === 'gold', 'Gold is now 2nd card on Home Page (displayOrder: 2)');
  assert(reorderedProducts[1].displayOrder === 2, 'Gold displayOrder is 2');
  assert(reorderedProducts[2].editionKey === 'platinum', 'Platinum is now 3rd card on Home Page (displayOrder: 3)');
  assert(reorderedProducts[3].editionKey === 'purple', 'Purple is now 4th card on Home Page (displayOrder: 4)');
  assert(reorderedProducts[4].editionKey === 'white', 'White is now 5th card on Home Page (displayOrder: 5)');

  // TEST 6: Unauthorized user cannot reorder products
  console.log('\n--- TEST 6: Role Authorization for Reordering ---');
  const unauthReorder = StorageEngine.reorderProducts(['white', 'metal'], 'customer', 'customer@example.com');
  assert(unauthReorder.success === false, 'Customer cannot reorder products');

  // TEST 7: Combined Ordering and Visibility
  console.log('\n--- TEST 7: Combined Ordering and Disabling ---');
  // Metal is 1st, Gold is 2nd. If Admin disables Metal:
  StorageEngine.toggleProductStatus('metal', 'disabled', 'admin', 'admin@flocard.in');
  const currentProducts = StorageEngine.getProducts();
  const visibleAfterDisable = currentProducts.filter(p => p.status !== 'disabled' && p.isActive !== false);
  
  assert(visibleAfterDisable.length === 4, '4 cards visible after disabling Metal');
  assert(visibleAfterDisable[0].editionKey === 'gold', 'Gold is now the first card shown to visitors on Home page');
  assert(visibleAfterDisable[0].displayOrder === 2, 'Gold retains its configured displayOrder: 2');

  console.log('\n====================================================');
  console.log(`🏁 Test Summary: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
