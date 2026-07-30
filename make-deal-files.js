/**
 * Integrity Homes - deal file generator
 * ---------------------------------------------------------------------------
 * Writes one markdown file per transaction into ./deal-files/, built entirely
 * from the live "IH Live Transaction Tracker" sheet.
 *
 * These files are a READABLE SNAPSHOT, not a second source of truth. That
 * distinction is the whole point: markdown deal files were retired as a source
 * on 2026-07-29 because hand-edited copies drifted from the sheet and nobody
 * could tell which was right. Generating them removes that failure mode, so
 * nothing here is ever edited by hand. Change the sheet, re-run this.
 *
 * Usage:  node make-deal-files.js
 */

const fs = require('fs');
const path = require('path');

const ENDPOINT = 'https://script.google.com/macros/s/AKfycby7uZ9eClgv0lqFzoN1UjDj77w21lGmVhvmCRunvPn1AavN3XfoFqavwYKvj7vpi74/exec';
const OUT_DIR = path.join(__dirname, 'deal-files');

const money = v => {
  const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) || !n ? '' : '$' + n.toLocaleString();
};
const has = v => v != null && String(v).trim() !== '';
// Filenames follow the client-folder convention John set up in Drive:
// "Seller - Address - Type". Falls back to the address alone when no name is on
// file yet, which is true for several listings today.
const slug = s => String(s || '')
  .replace(/[^A-Za-z0-9 ,&-]/g, '')
  .replace(/[,]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .slice(0, 80);

function table(rows) {
  const keep = rows.filter(r => has(r[1]));
  if (!keep.length) return '_Nothing recorded._\n';
  return keep.map(r => `| ${r[0]} | ${r[1]} |`).join('\n');
}
function kv(rows) {
  const keep = rows.filter(r => has(r[1]));
  if (!keep.length) return '_Nothing recorded._\n';
  return '| Field | Value |\n| --- | --- |\n' + table(keep) + '\n';
}

function activeDoc(r) {
  const head = [
    r.side, r.agent, money(r.price)
  ].filter(has).join(' · ');
  const timing = [
    has(r.accepted) ? 'Accepted ' + r.accepted : '',
    has(r.closing) ? 'Closing ' + r.closing : '',
    has(r.days_out) ? r.days_out + ' days out' : '',
    has(r.health) ? 'Health: ' + r.health : ''
  ].filter(has).join(' · ');

  let out = `# ${r.address}\n\n${head}\n${timing}\n\n`;

  if (has(r.action_needed_flags)) {
    out += `## Action needed\n\n${r.action_needed_flags}\n\n`;
  }

  out += '## Milestones\n\n' + kv([
    ['Earnest Money', r.earnest_money],
    ['Inspection', r.inspection],
    ['Radon', r.radon],
    ['Well / Septic', r.well_septic],
    ['Appraisal', r.appraisal],
    ['Financing', r.financing],
    ['Title', r.title_status]
  ]) + '\n';

  out += '## Parties\n\n' + kv([
    ['Buyer(s)', r.buyers],
    ['Seller(s)', r.sellers],
    ['Co-op agent', r.co_op_agent],
    ['Lender', r.lender],
    ['Title company', r.title_company]
  ]) + '\n';

  // Commission columns do not exist on the sheet yet. When they are added this
  // block starts populating on its own with no code change.
  const comp = kv([['Commission', r.commission], ['Co-op comp', r.co_op_comp]]);
  if (!comp.startsWith('_')) out += '## Compensation\n\n' + comp + '\n';

  return out;
}

function listingDoc(r) {
  const head = ['Listing', r.agent, r.status].filter(has).join(' · ');
  const price = [
    has(r.list) ? 'List ' + money(r.list) : '',
    has(r.current) ? 'Current ' + money(r.current) : '',
    has(r.last_price_cut) ? 'Last cut ' + r.last_price_cut : ''
  ].filter(has).join(' · ');

  let out = `# ${r.address}\n\n${head}\n${price}\n\n`;

  out += '## Seller\n\n' + kv([
    ['Seller(s)', r.sellers],
    ['Email', r.seller_email]
  ]) + '\n';

  out += '## Listing checklist\n\n' + kv([
    ['Pictures', r.pictures],
    ['Sign post', r.sign_post],
    ['Sign', r.sign],
    ['Lockbox', r.lockbox],
    ['Lockbox code', r.lockbox_code],
    ['Title search', r.title_search],
    ['Title company', r.title_company],
    ['Listing expires', r.listing_expires]
  ]) + '\n';

  const comp = kv([['Commission', r.commission], ['Co-op comp', r.co_op_comp]]);
  if (!comp.startsWith('_')) out += '## Compensation\n\n' + comp + '\n';

  if (has(r.notes)) out += `## Notes\n\n${r.notes}\n\n`;
  return out;
}

function closedDoc(r) {
  const head = [r.side, r.agent].filter(has).join(' · ');
  let out = `# ${r.address}\n\n${head}\n${r.status || 'Closed'} ${r.closed || ''} · ${money(r.price)}\n\n`;
  out += kv([
    ['Closed', r.closed],
    ['Price', money(r.price)],
    ['Side', r.side],
    ['Agent', r.agent],
    ['Lead source', r.lead_source],
    ['Status', r.status],
    ['Commission', r.commission],
    ['GCI', r.gci]
  ]) + '\n';
  return out;
}

function buyerDoc(r) {
  let out = `# ${r.client_names}\n\nBuyer lead · ${r.agent || 'unassigned'}\n\n`;
  out += kv([
    ['Best phone', r.best_phone],
    ['Email', r.email],
    ['Pre-approval', r.pre_approval],
    ['Price range', r.price_range],
    ['Areas / must-haves', r.areas_must_haves],
    ['Date received', r.date_received]
  ]) + '\n';
  if (has(r.notes)) out += `## Notes\n\n${r.notes}\n\n`;
  return out;
}

// One property can occupy a row on Listings AND a row on Active Transactions or
// Closed 2026 at the same time, written with different abbreviations in each
// ("706 E Mason Dr, Edgerton, WI" vs "...WI 53534", "1016 S 35th St" vs
// "1016 South 35th St"). Without this they would produce two or three separate
// deal files for the same house. Match on the street line with abbreviations
// spelled out, so the halves land in one file.
const ABBR = {
  st: 'street', str: 'street', dr: 'drive', rd: 'road', ave: 'avenue', av: 'avenue',
  ln: 'lane', ct: 'court', hwy: 'highway', blvd: 'boulevard', pkwy: 'parkway',
  cir: 'circle', pl: 'place', trl: 'trail', n: 'north', s: 'south', e: 'east', w: 'west'
};
function addrKey(address) {
  return String(address || '')
    .split(',')[0]
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(t => ABBR[t] || t)
    .join(' ');
}

function fileNameFor(g) {
  const r = g.listing || g.active || g.closed;
  if (g.buyerlead) return slug(g.buyerlead.client_names) + ' - Buyer.md';
  const who = (g.listing && g.listing.sellers) || (g.active && g.active.sellers) || '';
  const type = g.active ? (g.active.side === 'Buy' ? 'Purchase' : 'Listing')
    : g.listing ? 'Listing' : 'Closed';
  const addr = String(r.address || '').split(',')[0];
  return (has(who) ? slug(surname(who)) + ' - ' : '') + slug(addr) + ' - ' + type + '.md';
}

// The name a person would actually search by. Taking the last word of the whole
// string handles "Lawrence & Susan Davies" -> Davies and "April & Eric Beck" ->
// Beck, where taking the first segment would have given a first name. Entities
// keep their own name instead, so "GTGH Holdings LLC" is not filed under "LLC".
// Parentheticals are dropped because they hold the signer, not the owner:
// "Northwave Investments LLC (John Henke)".
function surname(s) {
  const t = String(s || '').replace(/\([^)]*\)/g, ' ').split('·')[0].trim();
  if (!t) return '';
  const words = t.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  if (/\b(llc|inc|corp|corporation|company|holdings|trust|ltd|lp)\b/i.test(t)) {
    return words.slice(0, 2).join(' ');
  }
  return words[words.length - 1];
}

function get(url) {
  return new Promise((resolve, reject) => {
    require('https').get(url, res => {
      if (res.statusCode >= 300 && res.headers.location) {
        return get(res.headers.location).then(resolve, reject);
      }
      let b = '';
      res.on('data', d => (b += d));
      res.on('end', () => resolve(b));
    }).on('error', reject);
  });
}

(async () => {
  const raw = await get(ENDPOINT + '?action=list&t=' + process.argv[2]);
  let payload;
  try { payload = JSON.parse(raw); } catch (e) {
    console.error('Backend did not return JSON. First 200 chars:\n' + raw.slice(0, 200));
    process.exit(1);
  }
  if (!payload.ok) { console.error('Backend error: ' + JSON.stringify(payload)); process.exit(1); }

  const deals = payload.deals || [];
  // The test rows are mine, from verifying the intake path. Skip them so they
  // never become a deal file.
  const rows = deals.filter(r => !/^ZZ TEST/i.test(String(r.key || '')));

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const stamp = process.argv[3] || '';

  // Group every row that describes the same property into one deal file.
  const groups = new Map();
  for (const r of rows) {
    const key = r.source === 'buyerlead'
      ? 'buyer::' + String(r.client_names || '').toLowerCase().trim()
      : addrKey(r.address);
    if (!groups.has(key)) groups.set(key, { rows: [] });
    const g = groups.get(key);
    g[r.source] = r;
    g.rows.push(r);
  }

  const written = [];
  let merged = 0;

  for (const g of groups.values()) {
    let body = '';
    if (g.buyerlead) {
      body = buyerDoc(g.buyerlead);
    } else {
      // Only the first section keeps the property title. Later sections are
      // appended under their own heading, so their H1 is stripped.
      const demote = s => s.replace(/^#\s.*\r?\n+/, '');
      if (g.active) body += activeDoc(g.active);
      if (g.closed) body += body ? '\n## Closing record\n\n' + demote(closedDoc(g.closed)) : closedDoc(g.closed);
      if (g.listing) body += body ? '\n## Listing record\n\n' + demote(listingDoc(g.listing)) : listingDoc(g.listing);
    }
    if (g.rows.length > 1) merged++;

    const src = g.rows.map(r => r.tab + ' row ' + r.rowNum).join(', ');
    const footer =
      '\n---\n\nGenerated from the IH Live Transaction Tracker (' + src + ')' +
      (stamp ? ' on ' + stamp : '') + '.\n' +
      'The sheet is the source of truth. Do not edit this file by hand,' +
      ' re-run `node make-deal-files.js` to refresh it.\n';

    let name = fileNameFor(g);
    let n = 2;
    while (written.includes(name)) { name = name.replace(/\.md$/, '') + ' (' + n++ + ').md'; }
    written.push(name);
    fs.writeFileSync(path.join(OUT_DIR, name), body + footer, 'utf8');
  }

  console.log('Wrote ' + written.length + ' deal files into deal-files/ from ' + rows.length + ' sheet rows');
  console.log('  ' + merged + ' properties had rows on more than one tab and were combined into one file');
  // Apps Script keeps the connection alive, which leaves node hanging after the
  // work is done. Nothing is pending at this point, so exit.
  process.exit(0);
})();
