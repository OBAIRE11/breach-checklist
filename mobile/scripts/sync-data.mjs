// Copies the website's breaches.json into the app as its built-in offline copy.
// The app still fetches the live list from the website on launch; this copy is only
// used when there's no connection. Run with: npm run sync-data
import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const from = fileURLToPath(new URL('../../breaches.json', import.meta.url));
const to = fileURLToPath(new URL('../src/data/breaches.json', import.meta.url));
copyFileSync(from, to);
console.log('Copied breaches.json into src/data/');
