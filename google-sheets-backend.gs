/**
 * Integrity Homes - Agent Intake + Command Center: Google Sheets backend
 * ------------------------------------------------------------------------
 * Replaces google-drive-backend.gs. The "IH Live Transaction Tracker" Google
 * Sheet is now the ONE source of truth for every deal. This script is the
 * only thing that reads and writes it. Runs as John's account.
 *
 * SHEET: 1HJZPXHP8y8cUdANbuiw916c8WLj66KYW8Qo_jSJ9oIs ("IH Live Transaction Tracker")
 * TABS : Active Transactions | Listings | Buyer Leads | Closed 2026 | Goals & Pipeline
 *
 * doGet  ?action=list                  -> every row from Active Transactions,
 *                                          Listings, and Buyer Leads, as JSON
 *                                          (JSONP if ?callback= is given)
 * doPost {action:'save', ...}          -> update specific cells in one row,
 *                                          matched by tab + address (or name
 *                                          for Buyer Leads, which has no address)
 * doPost {action:'intake', intake:...} -> append a new row from the Agent
 *                                          Intake app: Buyer-Offer -> Active
 *                                          Transactions, Seller -> Listings,
 *                                          Buyer -> Buyer Leads
 *
 * DEPLOY / REDEPLOY (keep the SAME url once first deployed):
 *   Deploy > Manage deployments > (pencil) edit > Version: New version > Deploy.
 */

// Bump this on every paste-and-deploy. doGet reports it, so we can confirm from
// the outside which build is actually live instead of guessing.
var BUILD = 'sheets-8';

var SHEET_ID = '1HJZPXHP8y8cUdANbuiw916c8WLj66KYW8Qo_jSJ9oIs';
var TAB_ACTIVE = 'Active Transactions';
var TAB_LISTINGS = 'Listings';
var TAB_BUYERLEADS = 'Buyer Leads';
var TAB_CLOSED = 'Closed 2026';

// Columns are only ever APPENDED to the right-hand end of these lists. Position
// in the list IS the column position in the sheet, so inserting one in the
// middle would silently shift every value after it into the wrong field.
// Any change here must be recorded in SHEET-FORMAT-LOG.md.
var COLS_ACTIVE = ['Address','Side','Agent','Price','Accepted','Earnest Money','Inspection','Radon','Well/Septic','Appraisal','Financing','Title Status','Closing','Days Out','Health','Action Needed / Flags','Buyer(s)','Seller(s)','Co-op Agent','Lender','Title Company','Commission','Co-op Comp'];
var COLS_LISTINGS = ['Address','Agent','Status','List $','Current $','Last Price Cut','Pictures','Sign Post','Sign','Lockbox','Lockbox Code','Title Search','Title Company','Sellers','Notes','Commission','Co-op Comp'];
var COLS_BUYERLEADS = ['Client Name(s)','Best Phone','Email','Pre-Approval','Price Range','Areas / Must-Haves','Agent','Date Received','Notes'];
var COLS_CLOSED = ['Address','Agent','Side','Closed','Price','Lead Source','Status','Commission','GCI'];

/* ---------------- entry points ---------------- */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'list') {
    var payload = { ok: true, deals: listDeals_() };
    if (p.callback) return js_(p.callback, payload);
    return json_(payload);
  }
  return json_({ ok: true, service: 'Integrity Homes Sheets backend', build: BUILD, ready: true });
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === 'save') {
      var res = saveField_(data.tab, data.key, data.updates || {});
      return json_({ ok: res.ok, error: res.error || null });
    }

    if (data.action === 'intake' && data.intake) {
      var out = routeIntake_(data.intake);
      return json_({ ok: true, tab: out.tab, row: out.row });
    }

    return json_({ ok: false, error: 'nothing to do' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ---------------- reading ---------------- */

function listDeals_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var out = [];
  out = out.concat(readTab_(ss, TAB_ACTIVE, COLS_ACTIVE, 'active'));
  out = out.concat(readTab_(ss, TAB_LISTINGS, COLS_LISTINGS, 'listing'));
  out = out.concat(readTab_(ss, TAB_BUYERLEADS, COLS_BUYERLEADS, 'buyerlead'));
  out = out.concat(readTab_(ss, TAB_CLOSED, COLS_CLOSED, 'closed'));
  return out;
}

// Not every tab starts with its header on row 1. "Closed 2026" has a goal
// tracker block above the column headers, so find the header by looking for the
// first column's name in the first 25 rows. Tabs whose header really is row 1
// are unaffected.
function headerRowOf_(sheet, firstCol) {
  var probe = Math.min(sheet.getLastRow(), 25);
  if (probe < 1) return 1;
  var col = sheet.getRange(1, 1, probe, 1).getDisplayValues();
  var want = String(firstCol).trim().toLowerCase();
  for (var r = 0; r < col.length; r++) {
    if (String(col[r][0]).trim().toLowerCase() === want) return r + 1;
  }
  return 1;
}

// Writes any header this script expects but the sheet does not have yet, and
// widens the grid if it is too narrow. Only ever fills a BLANK header cell and
// only at the end, so it can never rename or displace a column someone is
// already using. Runs on read as well as write so a new column appears the
// first time anything touches the tab, without a manual step.
function ensureHeaders_(sheet, cols) {
  var hdr = headerRowOf_(sheet, cols[0]);
  var max = sheet.getMaxColumns();
  if (max < cols.length) sheet.insertColumnsAfter(max, cols.length - max);
  var have = sheet.getRange(hdr, 1, 1, cols.length).getDisplayValues()[0];
  var changed = false;
  for (var c = 0; c < cols.length; c++) {
    if (String(have[c]).trim() === '') { have[c] = cols[c]; changed = true; }
  }
  if (changed) {
    var rng = sheet.getRange(hdr, 1, 1, cols.length);
    rng.setValues([have]);
    rng.setFontWeight('bold');
  }
  return hdr;
}

function readTab_(ss, tabName, cols, source) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var hdr = ensureHeaders_(sheet, cols);
  if (lastRow <= hdr) return [];
  var range = sheet.getRange(hdr + 1, 1, lastRow - hdr, cols.length);
  var values = range.getValues();
  var shown = range.getDisplayValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var key = row[0];
    if (!key) continue; // skip blank rows
    var rec = { source: source, tab: tabName, rowNum: hdr + 1 + i, key: String(key) };
    for (var c = 0; c < cols.length; c++) {
      rec[slugCol_(cols[c])] = cellValue_(row[c], shown[i][c]);
    }
    out.push(rec);
  }
  return out;
}

// Dates come back as the cell's DISPLAYED text, straight from the sheet. An
// earlier version reformatted the raw Date with a timezone, which was both
// fragile (a bad timezone argument threw and took down the whole endpoint) and
// wrong by a day whenever the script and spreadsheet timezones disagreed.
// Reading what the cell already shows means there is no timezone math to get
// wrong, and the app always matches what John and Lindsay see in the sheet.
// Everything else (numbers, text) passes through as its real value so the
// dashboard can still do math on prices.
function cellValue_(raw, shown) {
  if (raw instanceof Date) return shown;
  return raw;
}

function slugCol_(name) {
  return name.toLowerCase()
    .replace(/[()$]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/* ---------------- writing: single-cell / row updates ---------------- */

function colsFor_(tab) {
  if (tab === TAB_ACTIVE) return COLS_ACTIVE;
  if (tab === TAB_LISTINGS) return COLS_LISTINGS;
  if (tab === TAB_CLOSED) return COLS_CLOSED;
  return COLS_BUYERLEADS;
}

// Trims, lowercases, and collapses internal whitespace runs to one space, so
// "706 E Mason Dr, Edgerton, WI" typed with different spacing or casing still
// matches the same row. It does NOT paper over a genuinely different address
// (e.g. one copy missing the zip) - that's a real data mismatch, and the row
// should correctly fail to be found rather than silently match the wrong row.
function normKey_(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, ' ');
}

function saveField_(tab, key, updates) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(tab);
  if (!sheet) return { ok: false, error: 'no such tab: ' + tab };
  var cols = colsFor_(tab);
  var hdrRow = ensureHeaders_(sheet, cols);

  var lastRow = sheet.getLastRow();
  var keyCol = 1;
  var rowNum = -1;
  var wantKey = normKey_(key);
  for (var r = hdrRow + 1; r <= lastRow; r++) {
    var v = sheet.getRange(r, keyCol).getValue();
    if (normKey_(v) === wantKey) { rowNum = r; break; }
  }
  if (rowNum === -1) return { ok: false, error: 'row not found for key: ' + key };

  Object.keys(updates).forEach(function (slug) {
    var colIndex = -1;
    for (var c = 0; c < cols.length; c++) {
      if (slugCol_(cols[c]) === slug) { colIndex = c + 1; break; }
    }
    if (colIndex === -1) return;
    sheet.getRange(rowNum, colIndex).setValue(updates[slug]);
  });
  return { ok: true };
}

/* ---------------- writing: new intake -> new row ---------------- */

function routeIntake_(it) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  if (it.type === 'offer') return appendActiveFromOffer_(ss, it);
  if (it.type === 'seller') return appendListingFromSeller_(ss, it);
  return appendBuyerLead_(ss, it);
}

function appendActiveFromOffer_(ss, it) {
  var sheet = getOrCreateTab_(ss, TAB_ACTIVE, COLS_ACTIVE);
  var flags = [];
  if (it.missing && it.missing.length) flags.push('MISSING: ' + it.missing.join(', '));
  flags.push('New offer submitted ' + isoDate_(tzOf_(ss)) + ', awaiting acceptance.');
  var row = [
    it.address || '', 'Buy', it.agent || '', it.price || '',
    '', // Accepted - blank until actually accepted
    it.earnest || '', '', '', '', '', '', '', it.closedate || '', '', '',
    flags.join(' '), it.names || '', '', '', '', ''
  ];
  sheet.appendRow(row);
  return { tab: TAB_ACTIVE, row: sheet.getLastRow() };
}

function appendListingFromSeller_(ss, it) {
  var sheet = getOrCreateTab_(ss, TAB_LISTINGS, COLS_LISTINGS);
  var notes = [];
  if (it.missing && it.missing.length) notes.push('MISSING: ' + it.missing.join(', '));
  notes.push('New lead ' + isoDate_(tzOf_(ss)) + '. Anticipated list date: ' + (it.listdate || 'TBD') + '.');
  if (it.notes) notes.push(it.notes);
  var row = [
    it.address || '', it.agent || '', 'New Lead', '', '', '', '', '', '', '', '', '', '',
    it.names || '', notes.join(' ')
  ];
  sheet.appendRow(row);
  return { tab: TAB_LISTINGS, row: sheet.getLastRow() };
}

function appendBuyerLead_(ss, it) {
  var sheet = getOrCreateTab_(ss, TAB_BUYERLEADS, COLS_BUYERLEADS);
  var notes = [];
  if (it.missing && it.missing.length) notes.push('MISSING: ' + it.missing.join(', '));
  if (it.notes) notes.push(it.notes);
  var row = [
    it.names || '', it.phone || '', it.email || '', it.preapproval || '',
    it.pricerange || '', it.areas || '', it.agent || '', isoDate_(tzOf_(ss)), notes.join(' ')
  ];
  sheet.appendRow(row);
  return { tab: TAB_BUYERLEADS, row: sheet.getLastRow() };
}

function getOrCreateTab_(ss, name, cols) {
  var sheet = ss.getSheetByName(name);
  if (sheet) return sheet;
  sheet = ss.insertSheet(name);
  sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
  sheet.getRange(1, 1, 1, cols.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  return sheet;
}

/* ---------------- helpers ---------------- */

// Today's date, for stamping new intake rows. Writes still need a timezone, but
// this can never throw: if the spreadsheet or script timezone comes back as
// anything other than a usable string we fall back to Central, which is where
// Integrity Homes operates.
function tzOf_(ss) {
  var tz;
  try { tz = ss.getSpreadsheetTimeZone(); } catch (e) { tz = null; }
  if (typeof tz !== 'string' || !tz) {
    try { tz = Session.getScriptTimeZone(); } catch (e2) { tz = null; }
  }
  if (typeof tz !== 'string' || !tz) tz = 'America/Chicago';
  return tz;
}

function isoDate_(tz) {
  var d = new Date();
  return Utilities.formatDate(d, tz, 'M/d/yyyy');
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function js_(cb, obj) {
  return ContentService.createTextOutput(cb + '(' + JSON.stringify(obj) + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
