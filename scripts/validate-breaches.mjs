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

let companies;
try {
  companies = JSON.parse(readFileSync('breaches.json', 'utf8'));
} catch (err) {
  console.error('breaches.json is not valid JSON: ' + err.message);
  process.exit(1);
}
if (!Array.isArray(companies)) {
  console.error('breaches.json must be a list ([ ... ])');
  process.exit(1);
}

const thisYear = new Date().getFullYear();
const seen = new Map(); // lowercased name or alias -> entry number
let breachCount = 0;

function claim(label, where, i) {
  const key = label.trim().toLowerCase();
  if (seen.has(key)) errors.push(`${where}: "${label}" is already used by entry ${seen.get(key)}`);
  else seen.set(key, i + 1);
}

companies.forEach((c, i) => {
  const where = `Entry ${i + 1}` + (c && c.name ? ` (${c.name})` : '');
  if (!c || typeof c !== 'object') {
    errors.push(`${where}: must be an object`);
    return;
  }
  for (const key of Object.keys(c)) {
    if (!['name', 'aliases', 'breaches'].includes(key)) errors.push(`${where}: unknown field "${key}"`);
  }

  if (typeof c.name !== 'string' || !c.name.trim()) errors.push(`${where}: "name" is required`);
  else claim(c.name, where, i);

  if (c.aliases !== undefined) {
    if (!Array.isArray(c.aliases) || c.aliases.some(a => typeof a !== 'string' || !a.trim())) {
      errors.push(`${where}: "aliases" must be a list of names`);
    } else {
      c.aliases.forEach(a => claim(a, where, i));
    }
  }

  if (!Array.isArray(c.breaches) || c.breaches.length === 0) {
    errors.push(`${where}: "breaches" must be a non-empty list`);
    return;
  }
  c.breaches.forEach((b, j) => {
    const at = `${where}, breach ${j + 1}`;
    breachCount++;
    if (!b || typeof b !== 'object') {
      errors.push(`${at}: must be an object`);
      return;
    }
    for (const key of Object.keys(b)) {
      if (!['year', 'types', 'added', 'note'].includes(key)) errors.push(`${at}: unknown field "${key}"`);
    }
    if (!Number.isInteger(b.year) || b.year < 1990 || b.year > thisYear) {
      errors.push(`${at}: "year" must be a whole number between 1990 and ${thisYear}`);
    }
    if (!Array.isArray(b.types) || b.types.length === 0) {
      errors.push(`${at}: "types" must be a non-empty list`);
    } else {
      for (const t of b.types) {
        if (!allowedTypes.has(t)) errors.push(`${at}: unknown type "${t}" (allowed: ${[...allowedTypes].join(', ')})`);
      }
      if (new Set(b.types).size !== b.types.length) errors.push(`${at}: "types" has duplicates`);
    }
    if (typeof b.added !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.added) || isNaN(Date.parse(b.added))) {
      errors.push(`${at}: "added" must be a date like 2026-09-26`);
    }
    if (b.note !== undefined && (typeof b.note !== 'string' || !b.note.trim())) {
      errors.push(`${at}: "note" must be text`);
    }
  });
  const years = c.breaches.map(b => b.year);
  if (years.some((y, k) => k > 0 && y < years[k - 1])) errors.push(`${where}: list breaches oldest first`);
});

if (errors.length) {
  console.error(`breaches.json has ${errors.length} problem(s):\n`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`breaches.json looks good: ${companies.length} companies, ${breachCount} breaches.`);
