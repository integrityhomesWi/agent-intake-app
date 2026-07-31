/**
 * Integrity Homes - build the deployable site folder
 * ---------------------------------------------------------------------------
 * Copies ONLY the three app pages into ./site/. Nothing else is ever allowed in.
 *
 * This exists because of one specific risk. The project folder also holds
 * deal-files/, which contains client names, emails, phone numbers and sale
 * prices for every transaction. Publishing the project folder would publish all
 * of that. So the deploy target is built from an explicit allow-list rather than
 * by excluding things, because an allow-list fails safe: a new file added to the
 * project is invisible to the site until someone deliberately adds it here.
 *
 * Usage:  node make-site.js
 * Then deploy ./site/ and nothing but ./site/.
 */

const fs = require('fs');
const path = require('path');

// The complete list of files that may ever be published. Adding to this list is
// a deliberate act. Never widen it to a glob or a directory copy.
const PUBLIC_FILES = ['index.html', 'command-center.html', 'home.html'];

const SRC = __dirname;
const OUT = path.join(__dirname, 'site');

// Anything matching these is client data or internals and must never ship, even
// if someone adds it to PUBLIC_FILES by mistake. Belt and braces.
const NEVER = [/^deal-files\b/i, /\.gs$/i, /\.md$/i, /^\.git/i, /^\.claude/i, /^make-/i, /^site\b/i];

function refuse(name) {
  return NEVER.some(rx => rx.test(name));
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let copied = 0;
for (const f of PUBLIC_FILES) {
  if (refuse(f)) {
    console.error('REFUSED, this file is not publishable: ' + f);
    process.exit(1);
  }
  const from = path.join(SRC, f);
  if (!fs.existsSync(from)) {
    console.error('MISSING: ' + f);
    process.exit(1);
  }
  fs.copyFileSync(from, path.join(OUT, f));
  copied++;
}

// Prove the output contains nothing but the allow-list, so a mistake in this
// script cannot quietly ship client data.
const actual = fs.readdirSync(OUT).sort();
const expected = [...PUBLIC_FILES].sort();
const unexpected = actual.filter(f => !expected.includes(f));
if (unexpected.length) {
  console.error('ABORT, unexpected files in site/: ' + unexpected.join(', '));
  process.exit(1);
}

console.log('site/ built with ' + copied + ' files, verified clean:');
actual.forEach(f => console.log('  ' + f + '  (' + fs.statSync(path.join(OUT, f)).size + ' bytes)'));
console.log('\nDeploy ./site/ and nothing else. deal-files/ must never leave this machine.');
