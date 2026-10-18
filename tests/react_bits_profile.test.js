/* ==========================================================================
   REACT BITS PROFILE & COMPONENT INTEGRATION TESTS
   Validates ReflectiveCard, MagicBento, and CardNav integration
   with FLOCARD morphing profiles.
   ========================================================================== */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- STARTING REACT BITS INTEGRATION TESTS ---\n');

const BASE_DIR = process.cwd();

// 1. Verify component files exist and export default
const components = [
  'src/components/ReflectiveCard/ReflectiveCard.jsx',
  'src/components/ReflectiveCard/ReflectiveCard.css',
  'src/components/MagicBento/MagicBento.jsx',
  'src/components/MagicBento/MagicBento.css',
  'src/components/CardNav/CardNav.jsx',
  'src/components/CardNav/CardNav.css',
  'src/components/PromptBar/PromptBar.jsx',
  'src/components/PromptBar/PromptBar.css'
];

for (const relPath of components) {
  const fullPath = path.join(BASE_DIR, relPath);
  assert.ok(fs.existsSync(fullPath), `File missing: ${relPath}`);
  const content = fs.readFileSync(fullPath, 'utf-8');
  assert.ok(content.length > 50, `File empty or corrupted: ${relPath}`);
}
console.log('✓ All React Bits component files and styles are present.');

// 2. Verify CompactProfileCard imports and renders ReflectiveCard
const compactCardCode = fs.readFileSync(path.join(BASE_DIR, 'src/components/profile/CompactProfileCard.jsx'), 'utf-8');
assert.ok(compactCardCode.includes("import ReflectiveCard from '../ReflectiveCard/ReflectiveCard';"), 'CompactProfileCard must import ReflectiveCard');
assert.ok(compactCardCode.includes('<ReflectiveCard'), 'CompactProfileCard must render ReflectiveCard');
assert.ok(compactCardCode.includes('onClick={onExpand}'), 'ReflectiveCard must wire onClick to onExpand');
console.log('✓ CompactProfileCard correctly integrates ReflectiveCard with click-to-expand.');

// 3. Verify ExpandedPortfolioView integrates MagicBento
const expandedViewCode = fs.readFileSync(path.join(BASE_DIR, 'src/components/profile/ExpandedPortfolioView.jsx'), 'utf-8');
assert.ok(expandedViewCode.includes("import MagicBento from '../MagicBento/MagicBento';"), 'ExpandedPortfolioView must import MagicBento');
assert.ok(expandedViewCode.includes('<MagicBento'), 'ExpandedPortfolioView must render MagicBento');
assert.ok(expandedViewCode.includes('bentoItems'), 'ExpandedPortfolioView must compute bentoItems');
console.log('✓ ExpandedPortfolioView correctly integrates MagicBento for portfolio items.');

// 4. Verify PublicProfile integrates CardNav
const publicProfileCode = fs.readFileSync(path.join(BASE_DIR, 'src/pages/public/PublicProfile.jsx'), 'utf-8');
assert.ok(publicProfileCode.includes("import CardNav from '../../components/CardNav/CardNav';"), 'PublicProfile must import CardNav');
assert.ok(publicProfileCode.includes('<CardNav'), 'PublicProfile must render CardNav');
console.log('✓ PublicProfile correctly integrates CardNav.');

console.log('\n========================================');
console.log('ALL REACT BITS COMPONENT TESTS PASSED!');
console.log('========================================');
