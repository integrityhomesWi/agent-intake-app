/**
 * Integrity Homes - Agent Intake + Command Center: Google Drive backend (v2)
 * --------------------------------------------------------------------------
 * One small Google Apps Script that runs as John's account and is the ONLY thing
 * that reads and writes deal files in the Deal-Files folder. Agents never log in.
 *
 * Each deal is one markdown file (see DEAL-FILE-FORMAT.md). This backend:
 *   - save   : create or update a deal by id (assigns IH-YYMM-NNNN on new deals)
 *   - list   : return every deal record (for the dashboard, via JSONP so it can read it)
 *   - legacy : still accepts the old {name, body} POST from the first intake build
 *
 * DEPLOY / REDEPLOY (keep the SAME url):
 *   1. Paste this whole file over the old Code.gs, Save.
 *   2. Deploy > Manage deployments > (pencil) edit > Version: New version > Deploy.
 *   That keeps the existing /exec url so nothing downstream has to change.
 */

var DEAL_FILES_FOLDER_ID = '1ybN83Xpqq_0bWyEhASKzangkp45xF2XS';
var SHARED_SECRET = '';                 // optional; match DRIVE_SECRET in the apps if set
var JSON_OPEN = '<!--DEAL_JSON';
var JSON_CLOSE = 'DEAL_JSON-->';

/* ---------------- entry points ---------------- */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'list') {
    var payload = { ok: true, deals: listDeals() };
    if (p.callback) return js_(p.callback, payload);   // JSONP so a webpage can read it
    return json_(payload);
  }
  return json_({ ok: true, service: 'Integrity Homes backend v2', ready: true });
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (SHARED_SECRET && data.secret !== SHARED_SECRET) {
      return json_({ ok: false, error: 'unauthorized' });
    }

    // New model: save a structured deal record.
    if (data.action === 'save' && data.record) {
      var saved = saveDeal(data.record);
      return json_({ ok: true, id: saved.id, name: saved.name });
    }

    // Intake app can send its raw fields; we build a record from them.
    if (data.action === 'intake' && data.intake) {
      var rec = recordFromIntake(data.intake);
      var s2 = saveDeal(rec);
      return json_({ ok: true, id: s2.id, name: s2.name });
    }

    // Legacy: the very first intake build posted {name, body}. Still honored.
    if (data.name && data.body) {
      var name = sanitizeName_(data.name);
      writeFile_(name, String(data.body));
      return json_({ ok: true, id: '', name: name, legacy: true });
    }

    return json_({ ok: false, error: 'nothing to do' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ---------------- deal read/write ---------------- */

function listDeals() {
  var folder = DriveApp.getFolderById(DEAL_FILES_FOLDER_ID);
  var files = folder.getFilesByType(MimeType.PLAIN_TEXT);
  var out = [];
  while (files.hasNext()) {
    var f = files.next();
    var name = f.getName();
    if (name.slice(-3).toLowerCase() !== '.md') continue;
    var rec = parseDeal_(f.getBlob().getDataAsString());
    if (rec && rec.id) { rec._file = name; out.push(rec); }
  }
  return out;
}

function saveDeal(rec) {
  var folder = DriveApp.getFolderById(DEAL_FILES_FOLDER_ID);
  if (!rec.id) rec.id = nextId_(folder);
  rec.updatedAt = isoDate_();
  if (!rec.createdAt) rec.createdAt = rec.updatedAt;

  var built = buildDealFile_(rec);

  // Update in place if a file already holds this id; else create.
  var existing = findFileById_(folder, rec.id);
  if (existing) {
    existing.setContent(built.body);
    if (existing.getName() !== built.name) { try { existing.setName(built.name); } catch (e) {} }
    return { id: rec.id, name: existing.getName() };
  }
  folder.createFile(built.name, built.body, MimeType.PLAIN_TEXT);
  return { id: rec.id, name: built.name };
}

function findFileById_(folder, id) {
  var files = folder.getFilesByType(MimeType.PLAIN_TEXT);
  while (files.hasNext()) {
    var f = files.next();
    if (f.getName().slice(-3).toLowerCase() !== '.md') continue;
    if (f.getName().indexOf(id) === 0) return f;              // fast path: id-prefixed name
    var rec = parseDeal_(f.getBlob().getDataAsString());
    if (rec && rec.id === id) return f;
  }
  return null;
}

/* ---------------- id + file building ---------------- */

function nextId_(folder) {
  var d = new Date();
  var ym = String(d.getFullYear()).slice(2) + pad2_(d.getMonth() + 1);
  var prefix = 'IH-' + ym + '-';
  var max = 0;
  var files = folder.getFiles();
  while (files.hasNext()) {
    var n = files.next().getName();
    var m = n.match(/IH-\d{4}-(\d{4})/);
    if (m && n.indexOf(prefix) > -1) { var v = parseInt(m[1], 10); if (v > max) max = v; }
  }
  return prefix + pad2_(max + 1, 4);
}

function buildDealFile_(rec) {
  var title = rec.addr || rec.names || 'Deal';
  var name = rec.id + '_' + slug_(lastName_(rec.names) || firstWord_(rec.addr) || 'deal') + '.md';

  var L = [];
  L.push('# ' + shortAddr_(title) + ' — ' + rec.id);
  L.push('');
  L.push('Type: ' + (dealTypeLabel_(rec) ) +
         ' · Side: ' + (rec.side || '-') +
         ' · Agent: ' + (rec.owner || '-'));
  if (rec.status) L.push('Status: ' + rec.status);
  var money = [];
  if (rec.price) money.push('Price: ' + money_(rec.price));
  if (rec.list) money.push('List: ' + money_(rec.list));
  if (rec.close) money.push('Close: ' + rec.close);
  if (rec.accept) money.push('Accepted: ' + rec.accept);
  if (money.length) L.push(money.join(' · '));

  if (rec.parties && Object.keys(rec.parties).length) {
    L.push(''); L.push('## Parties');
    Object.keys(rec.parties).forEach(function (k) { L.push(k + ': ' + rec.parties[k]); });
  }
  if (rec.ms) {
    L.push(''); L.push('## Milestones');
    L.push('Earnest money: ' + msTxt_(rec.ms.em) + ' · Inspection: ' + msTxt_(rec.ms.insp) +
           ' · Radon: ' + msTxt_(rec.ms.radon) + ' · Appraisal: ' + msTxt_(rec.ms.appr) +
           ' · Financing: ' + msTxt_(rec.ms.fin));
  }
  // Intake contact block (helps the humans; also survives round trips in the JSON).
  var contact = [];
  if (rec.phone) contact.push('Phone: ' + rec.phone);
  if (rec.email) contact.push('Email: ' + rec.email);
  if (rec.preapproval) contact.push('Pre-approval: ' + rec.preapproval);
  if (contact.length) { L.push(''); L.push('## Contact'); contact.forEach(function (c) { L.push(c); }); }

  if (rec.changes && rec.changes.length) {
    L.push(''); L.push('## Counters & amendments');
    rec.changes.forEach(function (c) { L.push('- ' + c); });
  }
  if (rec.notes) { L.push(''); L.push('## Notes'); L.push(rec.notes); }

  if (rec.missing && rec.missing.length) {
    L.push(''); L.push('## *** MISSING — required ***');
    rec.missing.forEach(function (m) { L.push('- ' + m); });
  }

  L.push(''); L.push('---'); L.push('Last updated: ' + (rec.updatedAt || isoDate_()));
  L.push('');
  L.push(JSON_OPEN);
  L.push(JSON.stringify(rec, null, 2));
  L.push(JSON_CLOSE);

  return { name: name, body: L.join('\n') };
}

function parseDeal_(content) {
  if (!content) return null;
  var a = content.indexOf(JSON_OPEN);
  var b = content.indexOf(JSON_CLOSE);
  if (a === -1 || b === -1 || b < a) return null;
  var raw = content.substring(a + JSON_OPEN.length, b).trim();
  try { return JSON.parse(raw); } catch (e) { return null; }
}

/* ---------------- intake mapping ---------------- */

function recordFromIntake(it) {
  var t = it.type;
  var rec = {
    intakeType: t,
    names: it.names || '',
    phone: it.phone || '',
    email: it.email || '',
    preapproval: it.preapproval || '',
    notes: it.notes || '',
    owner: it.agent || '',
    team: 'Integrity Homes',
    status: 'New intake',
    ms: { em: '', insp: '', radon: '', appr: '', fin: '' },
    parties: {},
    dates: [],
    changes: [],
    missing: it.missing || []
  };
  if (t === 'buyer') {
    rec.side = 'Buy';
    rec.addr = it.names || 'New buyer';
    rec.type = 'Buyer lead';
    rec.pricerange = it.pricerange || '';
    rec.areas = it.areas || '';
    if (it.names) rec.parties['Buyer'] = it.names;
  } else if (t === 'offer') {
    rec.side = 'Buy';
    rec.addr = it.address || 'Property TBD';
    rec.type = 'Buyer-Offer';
    rec.price = num_(it.price);
    rec.close = it.closedate || '';
    rec.em = it.earnest || '';
    if (it.names) rec.parties['Buyer'] = it.names;
  } else if (t === 'seller') {
    rec.side = 'Listing';
    rec.addr = it.address || 'Listing TBD';
    rec.type = 'Seller / Listing';
    rec.listdate = it.listdate || '';
    if (it.names) rec.parties['Seller'] = it.names;
  }
  return rec;
}

/* ---------------- helpers ---------------- */

function writeFile_(name, body) {
  var folder = DriveApp.getFolderById(DEAL_FILES_FOLDER_ID);
  var ex = folder.getFilesByName(name);
  if (ex.hasNext()) { var f = ex.next(); f.setContent(body); return f; }
  return folder.createFile(name, body, MimeType.PLAIN_TEXT);
}
function sanitizeName_(n) { n = String(n).replace(/[\/\\:*?"<>|]/g, '-'); if (!/\.md$/i.test(n)) n += '.md'; return n; }
function slug_(s) { return String(s || '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'deal'; }
function lastName_(names) { if (!names) return ''; var first = String(names).split(/[,&]/)[0].trim().split(/\s+/); return first[first.length - 1] || ''; }
function firstWord_(s) { return String(s || '').split(',')[0] || ''; }
function shortAddr_(s) { return String(s || '').split(',')[0]; }
function pad2_(n, w) { var s = String(n); w = w || 2; while (s.length < w) s = '0' + s; return s; }
function isoDate_() { var d = new Date(); return d.getFullYear() + '-' + pad2_(d.getMonth() + 1) + '-' + pad2_(d.getDate()); }
function num_(v) { if (v == null) return null; var n = parseInt(String(v).replace(/[^0-9.]/g, ''), 10); return isNaN(n) ? null : n; }
function money_(n) { return '$' + Number(n).toLocaleString('en-US'); }
function dealTypeLabel_(rec) { return rec.type || rec.intakeType || 'Deal'; }
function msTxt_(v) { if (!v) return '-'; return v; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function js_(cb, obj) { return ContentService.createTextOutput(cb + '(' + JSON.stringify(obj) + ')').setMimeType(ContentService.MimeType.JAVASCRIPT); }
