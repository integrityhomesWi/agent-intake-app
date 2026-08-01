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
 * doPost {action:'converse', ...}      -> one turn of the guided voice
 *                                          follow-up conversation in the
 *                                          Agent Intake app. Calls Claude
 *                                          server-side using ANTHROPIC_API_KEY
 *                                          from this project's Script
 *                                          Properties (Project Settings >
 *                                          Script Properties) - the key never
 *                                          lives in the app itself.
 *
 * DEPLOY / REDEPLOY (keep the SAME url once first deployed):
 *   Deploy > Manage deployments > (pencil) edit > Version: New version > Deploy.
 */

// Bump this on every paste-and-deploy. doGet reports it, so we can confirm from
// the outside which build is actually live instead of guessing.
var BUILD = 'sheets-19';

var SHEET_ID = '1HJZPXHP8y8cUdANbuiw916c8WLj66KYW8Qo_jSJ9oIs';
var TAB_ACTIVE = 'Active Transactions';
var TAB_LISTINGS = 'Listings';
var TAB_BUYERLEADS = 'Buyer Leads';
var TAB_CLOSED = 'Closed 2026';

// Columns are only ever APPENDED to the right-hand end of these lists. Position
// in the list IS the column position in the sheet, so inserting one in the
// middle would silently shift every value after it into the wrong field.
// Any change here must be recorded in SHEET-FORMAT-LOG.md.
//
// ACTIVE_CATEGORIES is the single source of truth for Active Transactions:
// COLS_ACTIVE below is just this flattened, and rebuildActiveTransactions()
// uses the category names/spans directly to draw the grouped header row. The
// two can never drift apart because one is derived from the other.
var ACTIVE_CATEGORIES = [
  ['Overview', ['Address','Side','Agent','Price','Health','Action Needed / Flags','Days Out']],
  ['Buyer & Seller', ['Buyer(s)','Seller(s)']],
  ['Co-op Agent', ['Co-op Agent','Co-op Agent Company','Co-op Agent Email','Co-op Agent Phone']],
  ['Offer & Contract', ['Offer Date','Accepted','Counter-Offer Date','Amendment 1 Date','Amendment 1 Notes','Amendment 2 Date','Amendment 2 Notes','Amendment 3 Date','Amendment 3 Notes','Offer Written in Secondary Position','Time Frame to Rescind']],
  ['Earnest Money', ['Earnest Money','Earnest Money Holder','Earnest Money Status','Earnest Money Due Date']],
  ['Inspection', ['Inspection','Home Inspector','Inspection Status','Inspection Due Date','Inspection Notes','Repairs Deadline']],
  ['Radon', ['Radon','Radon Status','Radon Due Date','Radon Notes']],
  ['Termite', ['Termite Inspection Required','Termite Responsible Party']],
  ['Well / Septic / Water', ['Well/Septic','Septic Status','Septic Deadline','Well Status','Well Deadline','Water Status','Water Deadline','Septic/Well/Water Notes']],
  ['Appraisal', ['Appraisal','Appraisal Notes']],
  ['Financing', ['Financing','Financing Type','Lender','Amount Financed','Loan to Value','Interest Rate','Preapproval Deadline']],
  ['Title', ['Title Company','Title Status','Title Commitment Due Date']],
  ['Property Disclosures', ['RECR Completed','RECR Date','RECR Items Disclosed Notes','Lead-Based Paint Disclosure Required','Lead-Based Paint Disclosure Received']],
  ['Condo / HOA', ['HOA','Condo (Y/N)','Condo Doc Deadline']],
  ['Sale of Buyers Property', ['Home Sale Contingency','Home Sale Contingency Closing Date','Home Sale Contingency Bump Notice Period','Home Sale Contingency Notes','Buyers Property Listing Deadline','Buyers Property Accepted-Offer Deadline']],
  ['Special Contingencies', ['Special Contingency 1','Special Contingency 1 Deadline','Special Contingency 1 Notes','Special Contingency 2','Special Contingency 2 Deadline','Special Contingency 2 Notes','Special Contingency 3','Special Contingency 3 Deadline','Special Contingency 3 Notes','Special Contingency 4','Special Contingency 4 Deadline','Special Contingency 4 Notes','Special Contingency 5','Special Contingency 5 Deadline','Special Contingency 5 Notes']],
  ['Closing', ['Closing','Closing Time','Closing Location','Final Walkthrough Date','Final Walkthrough Time','Possession Date','Possession Notes']],
  ['Compensation', ['Commission','Co-op Comp']]
];
var COLS_ACTIVE = ACTIVE_CATEGORIES.reduce(function (acc, cat) { return acc.concat(cat[1]); }, []);

// Same pattern as ACTIVE_CATEGORIES above: single source of truth, COLS_
// arrays are just the flattened form. Buyer 1 Name is first (the row key,
// same role Address plays for Active Transactions/Listings) since the old
// single "Client Name(s)" field is retired in favor of separate Buyer 1/2
// contact fields.
var BUYERLEADS_CATEGORIES = [
  ['Buyers', ['Buyer 1 Name','Buyer 1 Phone','Buyer 1 Email','Buyer 2 Name','Buyer 2 Phone','Buyer 2 Email']],
  ['Overview', ['Agent','Date Received']],
  ['Search Criteria', ['Price Range']],
  ['Financing', ['Pre-Approval Status','Lender Name','Lender Company','Lender Phone','Lender Email','Pre-Approval Deadline']],
  ['Agreements', ['Pre-Agency Showing Agreement','Pre-Agency Showing Agreement Date','Buyer Agency Start','Buyer Agency End']],
  ['Compensation', ['Commission','Additional Fees','Referral Fee','Referral Name','Referral Phone','Referral Email','Referral Amount']],
  ['Real Broker Compliance', ['Affiliated Business Agreement Completed','Consumer Choice & Referral Completed','Right to Negotiate Commission']],
  ['Notes', ['Notes']]
];
var COLS_BUYERLEADS = BUYERLEADS_CATEGORIES.reduce(function (acc, cat) { return acc.concat(cat[1]); }, []);

var LISTINGS_CATEGORIES = [
  ['Property & Sellers', ['Address','Seller 1 Name','Seller 1 Phone','Seller 1 Email','Seller 2 Name','Seller 2 Phone','Seller 2 Email']],
  ['Listing Status', ['Status','List Date','Expiration Date','List Price','Current Price','Included Items','Excluded Items']],
  ['Media', ['Pictures/Drone/Video Status','Pictures/Drone/Video Completion ETA','Pictures/Drone/Video Folder Link','Virtual Tour Link']],
  ['Signage & Access', ['Sign Post Status','Sign Status','Access Type','Supra Serial #']],
  ['Title', ['Title Search Status','Title Company','Title Company Phone','Title Company Email']],
  ['Disclosures', ['Lead-Based Paint Status','RECR Status','Seller Refusal RECR Status']],
  ['Price Reductions', ['Price Reduction 1','Price Reduction 1 Date','Price Reduction 2','Price Reduction 2 Date','Price Reduction 3','Price Reduction 3 Date','Price Reduction 4','Price Reduction 4 Date','Price Reduction 5','Price Reduction 5 Date']],
  ['Compensation', ['Listing Commission','Seller Commission to Others','Additional Fees','Referral Fee','Referral Name','Referral Phone','Referral Email','Referral Amount']],
  ['Real Broker Compliance', ['Affiliated Business Agreement Completed','Consumer Choice & Referral Completed','Right to Negotiate Commission']]
];
var COLS_LISTINGS = LISTINGS_CATEGORIES.reduce(function (acc, cat) { return acc.concat(cat[1]); }, []);

var COLS_CLOSED = ['Address','Agent','Side','Closed','Price','Lead Source','Status','Commission','GCI'];

/* ---------------- ONE-TIME SETUP: rebuild tabs into categorized layouts ---------------- */
// Run these once manually from the Apps Script editor (select the function in
// the dropdown, click Run), then delete them. Not called from doGet/doPost.
// Each archives the existing tab (renamed, data untouched) and creates a
// fresh, empty tab in its place with a colored merged category header row
// above the real field-name row, plus collapsible column groups per
// category. Refuses to run twice - if an archive already exists, it stops
// rather than overwriting it.
function rebuildCategorizedTab_(tabName, categories) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var archiveName = tabName + ' (Archive)';
  if (ss.getSheetByName(archiveName)) {
    throw new Error('Archive already exists - already ran this once. Delete "' + archiveName + '" first if you really want to run it again.');
  }
  var old = ss.getSheetByName(tabName);
  if (!old) throw new Error('No "' + tabName + '" tab found.');
  old.setName(archiveName);

  var fresh = ss.insertSheet(tabName, old.getIndex());
  var totalCols = categories.reduce(function (sum, cat) { return sum + cat[1].length; }, 0);
  var max = fresh.getMaxColumns();
  if (max < totalCols) fresh.insertColumnsAfter(max, totalCols - max);
  var catRow = [], fieldRow = [], col = 1;
  var colors = ['#1c3d5a', '#2d5f8a']; // alternate two navy shades so adjacent categories are visually distinct
  categories.forEach(function (cat, i) {
    var name = cat[0], cols = cat[1];
    for (var c = 0; c < cols.length; c++) { catRow.push(c === 0 ? name : ''); fieldRow.push(cols[c]); }
    var startCol = col, span = cols.length;
    if (span > 1) fresh.getRange(1, startCol, 1, span).merge();
    fresh.getRange(1, startCol, 1, span).setBackground(colors[i % 2]).setFontColor('#ffffff').setFontWeight('bold');
    if (span > 1) fresh.getRange(2, startCol, fresh.getMaxRows() - 1, span).shiftColumnGroupDepth(1);
    col += span;
  });
  fresh.getRange(1, 1, 1, catRow.length).setValues([catRow]);
  fresh.getRange(2, 1, 1, fieldRow.length).setValues([fieldRow]);
  fresh.getRange(2, 1, 1, fieldRow.length).setFontWeight('bold');
  fresh.setFrozenRows(2);
  fresh.setFrozenColumns(1);
  Logger.log('Rebuilt "' + tabName + '". Old data archived in "' + archiveName + '". New tab is empty with ' + fieldRow.length + ' columns in ' + categories.length + ' categories.');
}
// No trailing underscore on these three - Apps Script's Run dropdown hides
// underscore-suffixed "private" functions, and these specifically need to
// be selectable there to run manually.
function rebuildActiveTransactions() { rebuildCategorizedTab_(TAB_ACTIVE, ACTIVE_CATEGORIES); }
function rebuildBuyerLeads() { rebuildCategorizedTab_(TAB_BUYERLEADS, BUYERLEADS_CATEGORIES); }
function rebuildListings() { rebuildCategorizedTab_(TAB_LISTINGS, LISTINGS_CATEGORIES); }

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

    if (data.action === 'converse') {
      return json_(converse_(data));
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

/* ---------------- voice conversation (Claude) ---------------- */
// Powers the guided follow-up conversation in the Agent Intake app: the app
// sends what the agent just said plus what's known so far, Claude extracts
// field values and decides the next natural spoken question. The API key
// lives in this project's Script Properties (Project Settings > Script
// Properties > ANTHROPIC_API_KEY) - never in the app itself.
function converse_(data) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) return { ok: false, error: 'no ANTHROPIC_API_KEY set in Script Properties' };

  var fieldDefs = data.fieldDefs || [];
  var know = data.know || {};
  var said = data.saidJustNow || '';

  var reqLines = fieldDefs.filter(function (f) { return f.req; })
    .map(function (f) { return '- ' + f.key + ': ' + f.lab; }).join('\n');
  var optLines = fieldDefs.filter(function (f) { return !f.req; })
    .map(function (f) { return '- ' + f.key + ': ' + f.lab; }).join('\n');

  var system = [
    'You are the voice assistant inside the Integrity Homes real estate agent intake app.',
    'An agent is speaking naturally to log a new ' + (data.typeLabel || data.type) + '.',
    'Required fields (must be filled before this intake is complete):',
    reqLines || '(none)',
    'Optional fields:',
    optLines || '(none)',
    '',
    'Rules:',
    '- Never invent information. Only fill a field if the agent actually said something for it.',
    '- Merge new information with what is already known below; do not erase a known value unless the agent clearly corrected it.',
    '- If every required field is filled, set done=true and spokenLine should be one short warm confirmation sentence.',
    '- If required fields are still missing, set done=false, and spokenLine should be ONE short natural spoken question about a single missing required field - never a list of multiple questions.',
    '- If the agent answer is not an actual value for the field you asked about - e.g. "skip", "not sure", "I do not know", "I do not have it", "do not have that", "none", "no idea", or anything else that declines or defers rather than answering - do NOT put that phrase into the field. Leave it out of fields entirely (so it stays missing) and move on to a different missing field next turn.',
    '- Never store a decline or non-answer phrase as a field value under any circumstance, even if it is the only thing the agent said in response to that question.',
    '- Phone numbers, emails, dates, and dollar amounts should be recorded in a clean plain format (e.g. "$450,000", "608-669-4226").',
    '- spokenLine is read aloud by text-to-speech to the agent. Keep it brief and conversational, not written prose.',
    '- Sound like a helpful colleague on a quick call, not a script. Vary your phrasing turn to turn - do not open every line with the same stock word ("Got it", "Great", "Perfect") every time. A short acknowledgment of what they just said is fine, but keep it natural and not repetitive across the conversation.',
    '',
    'Known so far (JSON): ' + JSON.stringify(know)
  ].join('\n');

  var payload = {
    model: 'claude-sonnet-5',
    max_tokens: 512,
    system: system,
    messages: [{
      role: 'user',
      content: said || '(The agent just started this intake and has not said anything yet. Ask an opening question about the first missing required field.)'
    }],
    tools: [{
      name: 'update_intake',
      description: 'Record extracted field values and the next thing to say to the agent.',
      input_schema: {
        type: 'object',
        properties: {
          fields: { type: 'object', description: 'All known field values as key:value pairs, merging new info from this turn with what was already known. Only include keys that have a real value.' },
          done: { type: 'boolean', description: 'True only if every required field now has a value.' },
          spokenLine: { type: 'string', description: 'One short sentence to speak next: a natural follow-up question, or a closing confirmation if done.' }
        },
        required: ['fields', 'done', 'spokenLine']
      }
    }],
    tool_choice: { type: 'tool', name: 'update_intake' }
  };

  var resp;
  try {
    resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    return { ok: false, error: 'request failed: ' + String(err) };
  }

  var code = resp.getResponseCode();
  var body;
  try { body = JSON.parse(resp.getContentText()); } catch (e2) { body = null; }
  if (code !== 200 || !body) {
    var msg = (body && body.error && body.error.message) || resp.getContentText().slice(0, 300);
    return { ok: false, error: 'Claude API error ' + code + ': ' + msg };
  }

  var toolUse = (body.content || []).filter(function (c) { return c.type === 'tool_use'; })[0];
  if (!toolUse) return { ok: false, error: 'no structured response from Claude' };

  var out = toolUse.input || {};
  return { ok: true, fields: out.fields || {}, done: !!out.done, spokenLine: out.spokenLine || '' };
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
