// Dependency-free build: copies src/ and public/ into dist/ and runs sanity checks.
import { cpSync, rmSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'src'), dist, { recursive: true });
cpSync(join(root, 'public'), dist, { recursive: true });
writeFileSync(join(dist, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(dist);
const errors = [];

// favicon must be a 32x32 SVG without double hyphens
const fav = readFileSync(join(dist, 'favicon.svg'), 'utf8');
if (!/viewBox="0 0 32 32"/.test(fav)) errors.push('favicon.svg is not 32x32');
if (fav.includes('--')) errors.push('favicon.svg contains a double hyphen');

// no visible dates or timestamps in markup
const html = readFileSync(join(dist, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
const datePatterns = [/\b\d{4}-\d{2}-\d{2}\b/, /\b\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}\b/, /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2}\b/i, /\b\d{1,2}:\d{2}\b/, /\bQ[1-4]\s*\d{4}\b/];
const text = html.replace(/<[^>]+>/g, ' ');
for (const p of datePatterns) if (p.test(text)) errors.push('date-like text found: ' + p);

if (errors.length) { console.error('Build checks failed:\n - ' + errors.join('\n - ')); process.exit(1); }
console.log(`dist/ ready: ${files.length} files`);
