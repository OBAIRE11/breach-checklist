// Checks breaches.json for mistakes before they reach the live site.
// Run locally with: node scripts/validate-breaches.mjs
import { readFileSync } from 'node:fs';

const errors = [];

// Allowed data types come from DATA_TYPES in index.html, so the two can't drift apart.
const html = readFileSync('index.html', 'utf8');
const typesBlock = html.match(/const DATA_TYPES = \{([\s\S]*?)\n\};/);
if (!typesBlock) {
  console.error('Could not find DATA_TYPES in index.html');
  process.exit(1);
}
const allowedTypes = new Set([...typesBlock[1].matchAll(/^\s*(\w+):/gm)].map(m => m[1]));

let breaches;
try {
  breaches = JSON.parse(readFileSync('breaches.json', 'utf8'));
} catch (err) {
  console.error('breaches.json is not valid JSON: ' + err.message);
  process.exit(1);
}
if (!Array.isArray(breaches)) {
  console.error('breaches.json must be a list ([ ... ])');
  process.exit(1);
}

const thisYear = new Date().getFullYear();
const seen = new Map();

breaches.forEach((b, i) => {
  const where = `Entry ${i + 1}` + (b && b.name ? ` (${b.name})` : '');
  if (!b || typeof b !== 'object') {
    errors.push(`${where}: must be an object`);
    return;
  }
  const allowedKeys = ['name', 'year', 'types', 'added'];
  for (const key of Object.keys(b)) {
    if (!allowedKeys.includes(key)) errors.push(`${where}: unknown field "${key}"`);
  }

  if (typeof b.name !== 'string' || !b.name.trim()) {
    errors.push(`${where}: "name" is required`);
  } else {
    const key = b.name.trim().toLowerCase();
    if (seen.has(key)) errors.push(`${where}: duplicate of entry ${seen.get(key)}`);
    else seen.set(key, i + 1);
  }

  if (!Number.isInteger(b.year) || b.year < 1990 || b.year > thisYear) {
    errors.push(`${where}: "year" must be a whole number between 1990 and ${thisYear}`);
  }

  if (!Array.isArray(b.types) || b.types.length === 0) {
    errors.push(`${where}: "types" must be a non-empty list`);
  } else {
    for (const t of b.types) {
      if (!allowedTypes.has(t)) {
        errors.push(`${where}: unknown type "${t}" (allowed: ${[...allowedTypes].join(', ')})`);
      }
    }
    if (new Set(b.types).size !== b.types.length) errors.push(`${where}: "types" has duplicates`);
  }

  if (typeof b.added !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.added) || isNaN(Date.parse(b.added))) {
    errors.push(`${where}: "added" must be a date like 2026-09-26`);
  }
});

if (errors.length) {
  console.error(`breaches.json has ${errors.length} problem(s):\n`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`breaches.json looks good: ${breaches.length} breaches.`);
