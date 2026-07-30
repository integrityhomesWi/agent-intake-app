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

var SHEET_ID = '1HJZPXHP8y8cUdANbuiw916c8WLj66KYW8Qo_jSJ9oIs';
var TAB_ACTIVE = 'Active Transactions';
var TAB_LISTINGS = 'Listings';
var TAB_BUYERLEADS = 'Buyer Leads';

var COLS_ACTIVE = ['Address','Side','Agent','Price','Accepted','Earnest Money','Inspection','Radon','Well/Septic','Appraisal','Financing','Title Status','Closing','Days Out','Health','Action Needed / Flags','Buyer(s)','Seller(s)','Co-op Agent','Lender','Title Company'];
var COLS_LISTINGS = ['Address','Agent','Status','List $','Current $','Last Price Cut','Pictures','Sign Post','Sign','Lockbox','Lockbox Code','Title Search','Title Company','Sellers','Notes'];
var COLS_BUYERLEADS = ['Client Name(s)','Best Phone','Email','Pre-Approval','Price Range','Areas / Must-Haves','Agent','Date Received','Notes'];

/* ---------------- entry points ---------------- */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'list') {
    var payload = { ok: true, deals: listDeals_() };
    if (p.callback) return js_(p.callback, payload);
    return json_(payload);
  }
  return json_({ ok: true, service: 'Integrity Homes Sheets backend', ready: true });
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
  return out;
}

function readTab_(ss, tabName, cols, source) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, cols.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var keyCol = cols[0]; // Address for active/listing, Client Name(s) for buyerlead
    var key = row[0];
    if (!key) continue; // skip blank rows
    var rec = { source: source, tab: tabName, rowNum: i + 2, key: String(key) };
    for (var c = 0; c < cols.length; c++) {
      rec[slugCol_(cols[c])] = formatCell_(row[c]);
    }
    out.push(rec);
  }
  return out;
}

function formatCell_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'M/d/yyyy');
  }
  return v;
}

function slugCol_(name) {
  return name.toLowerCase()
    .replace(/[()$]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/* ---------------- writing: single-cell / row updates ---------------- */

function saveField_(tab, key, updates) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(tab);
  if (!sheet) return { ok: false, error: 'no such tab: ' + tab };
  var cols = tab === TAB_ACTIVE ? COLS_ACTIVE : tab === TAB_LISTINGS ? COLS_LISTINGS : COLS_BUYERLEADS;

  var lastRow = sheet.getLastRow();
  var keyCol = 1;
  var rowNum = -1;
  for (var r = 2; r <= lastRow; r++) {
    var v = sheet.getRange(r, keyCol).getValue();
    if (String(v).trim() === String(key).trim()) { rowNum = r; break; }
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
  flags.push('New offer submitted ' + isoDate_() + ', awaiting acceptance.');
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
  notes.push('New lead ' + isoDate_() + '. Anticipated list date: ' + (it.listdate || 'TBD') + '.');
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
    it.pricerange || '', it.areas || '', it.agent || '', isoDate_(), notes.join(' ')
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

function isoDate_() {
  var d = new Date();
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'M/d/yyyy');
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function js_(cb, obj) {
  return ContentService.createTextOutput(cb + '(' + JSON.stringify(obj) + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
