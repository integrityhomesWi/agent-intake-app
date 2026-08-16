// Integrity Homes - Agent Intake + Command Center: Airtable backend
// ------------------------------------------------------------------------
// Replaces google-sheets-backend.gs. The "IH Transaction Tracker" Airtable
// base is now the ONE source of truth for every deal. This Cloudflare Worker
// is the only thing that reads and writes it - the Airtable token lives only
// in this Worker's encrypted secrets, never in either app.
//
// BASE: appVvzwT3K2OTwRgR ("IH Transaction Tracker")
// TABLES: Active Transactions | Listings | Buyer Leads | Closed Deals
//         (Monthly Goals / Quarterly Goals / Annual Settings / Pipeline Notes
//         / Referrals / VIP Clients exist too, for a future Goals & Pipeline
//         wiring pass - not read or written by this Worker yet.)
//
// GET  ?action=list                  -> every row from Active Transactions,
//                                        Listings, and Buyer Leads, as JSON
//                                        (JSONP if ?callback= is given)
// GET  ?action=schema                -> category/field layout per table
// GET  ?action=closeDeal&address=... -> move a row from Active Transactions
//                                        to Closed Deals
// POST {action:'save', ...}          -> update specific fields in one row,
//                                        matched by tab + key (address, or
//                                        Buyer 1 Name for Buyer Leads)
// POST {action:'intake', intake:...} -> append a new row from the Agent
//                                        Intake app: Buyer-Offer -> Active
//                                        Transactions, Seller -> Listings,
//                                        Buyer -> Buyer Leads
// POST {action:'converse', ...}      -> one turn of the guided voice
//                                        follow-up conversation in the
//                                        Agent Intake app. Calls Claude
//                                        server-side using the ANTHROPIC_API_KEY
//                                        secret - the key never lives in the
//                                        app itself.
//
// DEPLOY: from this folder, `CLOUDFLARE_API_TOKEN=... npx wrangler deploy`.
// Secrets (one-time, or whenever rotated): `npx wrangler secret put AIRTABLE_API_KEY`
// and `npx wrangler secret put ANTHROPIC_API_KEY`.

// Bump this on every deploy. The root response reports it, so we can confirm
// from the outside which build is actually live instead of guessing.
const BUILD = 'airtable-1';

const BASE_ID = 'appVvzwT3K2OTwRgR';
const TABLES = {
  active: { id: 'tblhSpPgVvANQ1WdE', name: 'Active Transactions' },
  listings: { id: 'tblCB0G92dxcG12FU', name: 'Listings' },
  buyerlead: { id: 'tblJdlC8bLaLTUrfd', name: 'Buyer Leads' },
  closed: { id: 'tblnwjW8sSF3rCmAC', name: 'Closed Deals' }
};
// Maps the tab names the frontend already sends (unchanged from the Sheet
// era) to the source key used internally and in ?action=list output.
const TAB_NAME_TO_SOURCE = {
  'Active Transactions': 'active',
  'Listings': 'listings',
  'Buyer Leads': 'buyerlead'
};

// Same category/field-name layout as ACTIVE_CATEGORIES/LISTINGS_CATEGORIES/
// BUYERLEADS_CATEGORIES in google-sheets-backend.gs, updated to the field
// names actually used in Airtable after migration (a handful were renamed:
// Closing -> Closing Date, Earnest Money -> Earnest Money Amount, Accepted ->
// Accepted Date, Preapproval Deadline -> Financing/Preapproval Deadline; Lead
// Source and Special Contingencies were also added new). The primary field
// (first field of the first category) plays the same role Address/Buyer 1
// Name played in the Sheet: the row key used to match a record for save/close.
const ACTIVE_CATEGORIES = [
  ['Overview', ['Address', 'Side', 'Agent', 'Price', 'Health', 'Action Needed / Flags', 'Days Out', 'Lead Source']],
  ['Buyer & Seller', ['Buyer(s)', 'Seller(s)']],
  ['Co-op Agent', ['Co-op Agent', 'Co-op Agent Company', 'Co-op Agent Email', 'Co-op Agent Phone']],
  ['Offer & Contract', ['Offer Date', 'Accepted Date', 'Counter-Offer Date', 'Amendment 1 Date', 'Amendment 1 Notes', 'Amendment 2 Date', 'Amendment 2 Notes', 'Amendment 3 Date', 'Amendment 3 Notes', 'Offer Written in Secondary Position', 'Time Frame to Rescind']],
  ['Earnest Money', ['Earnest Money Amount', 'Earnest Money Holder', 'Earnest Money Status', 'Earnest Money Due Date']],
  ['Inspection', ['Inspection', 'Home Inspector', 'Inspection Status', 'Inspection Due Date', 'Inspection Notes', 'Repairs Deadline']],
  ['Radon', ['Radon', 'Radon Status', 'Radon Due Date', 'Radon Notes']],
  ['Termite', ['Termite Inspection Required', 'Termite Responsible Party']],
  ['Well / Septic / Water', ['Well/Septic', 'Septic Status', 'Septic Deadline', 'Well Status', 'Well Deadline', 'Water Status', 'Water Deadline', 'Septic/Well/Water Notes']],
  ['Appraisal', ['Appraisal', 'Appraisal Notes']],
  ['Financing', ['Financing', 'Financing Type', 'Lender', 'Amount Financed', 'Loan to Value', 'Interest Rate', 'Financing/Preapproval Deadline']],
  ['Title', ['Title Company', 'Title Status', 'Title Commitment Due Date']],
  ['Property Disclosures', ['RECR Completed', 'RECR Date', 'RECR Items Disclosed Notes', 'Lead-Based Paint Disclosure Required', 'Lead-Based Paint Disclosure Received']],
  ['Condo / HOA', ['HOA', 'Condo (Y/N)', 'Condo Doc Deadline']],
  ['Sale of Buyers Property', ['Home Sale Contingency', 'Home Sale Contingency Closing Date', 'Home Sale Contingency Bump Notice Period', 'Home Sale Contingency Notes', 'Buyers Property Listing Deadline', 'Buyers Property Accepted-Offer Deadline']],
  ['Special Contingencies', ['Special Contingencies', 'Special Contingency 1', 'Special Contingency 1 Deadline', 'Special Contingency 1 Notes', 'Special Contingency 2', 'Special Contingency 2 Deadline', 'Special Contingency 2 Notes', 'Special Contingency 3', 'Special Contingency 3 Deadline', 'Special Contingency 3 Notes', 'Special Contingency 4', 'Special Contingency 4 Deadline', 'Special Contingency 4 Notes', 'Special Contingency 5', 'Special Contingency 5 Deadline', 'Special Contingency 5 Notes']],
  ['Closing', ['Closing Date', 'Closing Time', 'Closing Location', 'Final Walkthrough Date', 'Final Walkthrough Time', 'Possession Date', 'Possession Notes']],
  ['Compensation', ['Commission', 'Co-op Comp']]
];
const LISTINGS_CATEGORIES = [
  ['Property & Sellers', ['Address', 'Agent', 'Seller(s)', 'Seller 1 Name', 'Seller 1 Phone', 'Seller 1 Email', 'Seller 2 Name', 'Seller 2 Phone', 'Seller 2 Email']],
  ['Listing Status', ['Status', 'List Date', 'Expiration Date', 'List Price', 'Current Price', 'Included Items', 'Excluded Items']],
  ['Media', ['Pictures/Drone/Video Status', 'Pictures/Drone/Video Completion ETA', 'Pictures/Drone/Video Folder Link', 'Virtual Tour Link']],
  ['Signage & Access', ['Sign Post Status', 'Sign Status', 'Access Type', 'Supra Serial #']],
  ['Title', ['Title Search Status', 'Title Company', 'Title Company Phone', 'Title Company Email']],
  ['Disclosures', ['Lead-Based Paint Status', 'RECR Status', 'Seller Refusal RECR Status']],
  ['Price Reductions', ['Price Reduction 1', 'Price Reduction 1 Date', 'Price Reduction 2', 'Price Reduction 2 Date', 'Price Reduction 3', 'Price Reduction 3 Date', 'Price Reduction 4', 'Price Reduction 4 Date', 'Price Reduction 5', 'Price Reduction 5 Date']],
  ['Compensation', ['Listing Commission', 'Seller Commission to Others', 'Additional Fees', 'Referral Fee', 'Referral Name', 'Referral Phone', 'Referral Email', 'Referral Amount']],
  ['Real Broker Compliance', ['Affiliated Business Agreement Completed', 'Consumer Choice & Referral Completed', 'Right to Negotiate Commission']],
  ['Lead Source', ['Lead Source']],
  ['Notes', ['Notes']]
];
const BUYERLEADS_CATEGORIES = [
  ['Buyers', ['Buyer 1 Name', 'Buyer 1 Phone', 'Buyer 1 Email', 'Buyer 2 Name', 'Buyer 2 Phone', 'Buyer 2 Email']],
  ['Overview', ['Agent', 'Date Received']],
  ['Search Criteria', ['Price Range']],
  ['Financing', ['Pre-Approval Status', 'Lender Name', 'Lender Company', 'Lender Phone', 'Lender Email', 'Pre-Approval Deadline']],
  ['Agreements', ['Pre-Agency Showing Agreement', 'Pre-Agency Showing Agreement Date', 'Buyer Agency Start', 'Buyer Agency End']],
  ['Compensation', ['Commission', 'Additional Fees', 'Referral Fee', 'Referral Name', 'Referral Phone', 'Referral Email', 'Referral Amount']],
  ['Real Broker Compliance', ['Affiliated Business Agreement Completed', 'Consumer Choice & Referral Completed', 'Right to Negotiate Commission']],
  ['Notes', ['Notes']]
];
const COLS_ACTIVE = ACTIVE_CATEGORIES.reduce((acc, cat) => acc.concat(cat[1]), []);
const COLS_LISTINGS = LISTINGS_CATEGORIES.reduce((acc, cat) => acc.concat(cat[1]), []);
const COLS_BUYERLEADS = BUYERLEADS_CATEGORIES.reduce((acc, cat) => acc.concat(cat[1]), []);
const COLS_CLOSED = ['Address', 'Agent', 'Side', 'Closed Date', 'Price', 'Lead Source', 'Status', 'Gross Commission (GCI)', 'Net Commission', 'Notes'];
const PRIMARY_FIELD = { active: 'Address', listings: 'Address', buyerlead: 'Buyer 1 Name', closed: 'Address' };
const COLS_FOR = { active: COLS_ACTIVE, listings: COLS_LISTINGS, buyerlead: COLS_BUYERLEADS, closed: COLS_CLOSED };
// The frontend's source tags predate this table's internal key name (it was
// "listing", singular, in the old Sheet backend) - keep that exact string so
// command-center.html's `r.source==='listing'` filters keep matching.
const SOURCE_TAG = { active: 'active', listings: 'listing', buyerlead: 'buyerlead', closed: 'closed' };

function slugCol_(name) {
  return name.toLowerCase()
    .replace(/[()$]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
function normKey_(s) {
  return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ');
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
function json_(obj) {
  return new Response(JSON.stringify(obj), { headers: { 'content-type': 'application/json', ...CORS_HEADERS } });
}
function js_(cb, obj) {
  return new Response(cb + '(' + JSON.stringify(obj) + ')', { headers: { 'content-type': 'application/javascript', ...CORS_HEADERS } });
}

/* ---------------- Airtable REST helpers ---------------- */

async function atFetch_(env, path, opts) {
  const res = await fetch('https://api.airtable.com/v0/' + BASE_ID + path, {
    ...opts,
    headers: {
      'Authorization': 'Bearer ' + env.AIRTABLE_API_KEY,
      'Content-Type': 'application/json',
      ...(opts && opts.headers)
    }
  });
  const body = await res.json();
  if (!res.ok) throw new Error((body && body.error && (body.error.message || body.error.type)) || ('Airtable error ' + res.status));
  return body;
}

// Airtable omits empty fields entirely rather than returning ''. listRecords_
// fills every known column back in as '' so callers see the same shape the
// Sheet backend always produced, and slugifies every key the same way
// readTab_ did there.
async function listRecords_(env, tableKey) {
  const table = TABLES[tableKey];
  const cols = COLS_FOR[tableKey];
  let out = [];
  let offset;
  do {
    const qs = 'pageSize=100' + (offset ? '&offset=' + encodeURIComponent(offset) : '');
    const body = await atFetch_(env, '/' + table.id + '?' + qs, { method: 'GET' });
    out = out.concat(body.records || []);
    offset = body.offset;
  } while (offset);
  return out.map(rec => {
    const flat = { source: SOURCE_TAG[tableKey], tab: table.name, recordId: rec.id, key: String(rec.fields[PRIMARY_FIELD[tableKey]] || '') };
    cols.forEach(name => {
      const v = rec.fields[name];
      flat[slugCol_(name)] = (v === undefined || v === null) ? '' : v;
    });
    return flat;
  });
}

async function findRecordByKey_(env, tableKey, key) {
  const records = await listRecords_(env, tableKey);
  const want = normKey_(key);
  return records.find(r => normKey_(r.key) === want) || null;
}

/* ---------------- reading ---------------- */

async function listDeals_(env) {
  const [active, listings, buyerlead, closed] = await Promise.all([
    listRecords_(env, 'active'),
    listRecords_(env, 'listings'),
    listRecords_(env, 'buyerlead'),
    listRecords_(env, 'closed')
  ]);
  return active.concat(listings, buyerlead, closed);
}

/* ---------------- writing ---------------- */

async function saveField_(env, tabName, key, updates) {
  const tableKey = TAB_NAME_TO_SOURCE[tabName];
  if (!tableKey) return { ok: false, error: 'no such tab: ' + tabName };
  const found = await findRecordByKey_(env, tableKey, key);
  if (!found) return { ok: false, error: 'row not found for key: ' + key };

  const cols = COLS_FOR[tableKey];
  const fields = {};
  const unmatched = [];
  Object.keys(updates).forEach(slug => {
    const colName = cols.find(c => slugCol_(c) === slugCol_(slug));
    if (!colName) { unmatched.push(slug); return; }
    fields[colName] = updates[slug];
  });
  if (unmatched.length) return { ok: false, error: 'no matching column for: ' + unmatched.join(', ') };

  await atFetch_(env, '/' + TABLES[tableKey].id + '/' + found.recordId, {
    method: 'PATCH',
    body: JSON.stringify({ fields, typecast: true })
  });
  return { ok: true };
}

function buildFields_(valuesByName) {
  const fields = {};
  Object.keys(valuesByName).forEach(name => {
    const v = valuesByName[name];
    if (v !== undefined && v !== null && v !== '') fields[name] = v;
  });
  return fields;
}

function isoDate_() {
  const tz = 'America/Chicago';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = t => parts.find(p => p.type === t).value;
  return get('year') + '-' + get('month') + '-' + get('day');
}

async function appendActiveFromOffer_(env, it) {
  const flags = [];
  if (it.missing && it.missing.length) flags.push('MISSING: ' + it.missing.join(', '));
  flags.push('New offer submitted ' + isoDate_() + ', awaiting acceptance.');
  const fields = buildFields_({
    'Address': it.address, 'Side': 'Buy', 'Agent': it.agent, 'Price': it.price,
    'Buyer(s)': it.names, 'Earnest Money Amount': it.earnest, 'Closing Date': it.closedate,
    'Action Needed / Flags': flags.join(' ')
  });
  const body = await atFetch_(env, '/' + TABLES.active.id, { method: 'POST', body: JSON.stringify({ records: [{ fields }], typecast: true }) });
  return { tab: TABLES.active.name, recordId: body.records[0].id };
}

async function appendListingFromSeller_(env, it) {
  const notes = [];
  if (it.missing && it.missing.length) notes.push('MISSING: ' + it.missing.join(', '));
  notes.push('New lead ' + isoDate_() + '. Anticipated list date: ' + (it.listdate || 'TBD') + '.');
  if (it.notes) notes.push(it.notes);
  const fields = buildFields_({
    'Address': it.address, 'Agent': it.agent, 'Status': 'New Lead',
    'Seller 1 Name': it.names, 'Seller 1 Phone': it.phone, 'Seller 1 Email': it.email,
    'Notes': notes.join(' ')
  });
  const body = await atFetch_(env, '/' + TABLES.listings.id, { method: 'POST', body: JSON.stringify({ records: [{ fields }], typecast: true }) });
  return { tab: TABLES.listings.name, recordId: body.records[0].id };
}

async function appendBuyerLead_(env, it) {
  const notes = [];
  if (it.missing && it.missing.length) notes.push('MISSING: ' + it.missing.join(', '));
  if (it.areas) notes.push('Areas / must-haves: ' + it.areas);
  if (it.notes) notes.push(it.notes);
  const fields = buildFields_({
    'Buyer 1 Name': it.names, 'Buyer 1 Phone': it.phone, 'Buyer 1 Email': it.email,
    'Agent': it.agent, 'Date Received': isoDate_(), 'Price Range': it.pricerange,
    'Pre-Approval Status': it.preapproval, 'Notes': notes.join(' ')
  });
  const body = await atFetch_(env, '/' + TABLES.buyerlead.id, { method: 'POST', body: JSON.stringify({ records: [{ fields }], typecast: true }) });
  return { tab: TABLES.buyerlead.name, recordId: body.records[0].id };
}

async function routeIntake_(env, it) {
  if (it.type === 'offer') return appendActiveFromOffer_(env, it);
  if (it.type === 'seller') return appendListingFromSeller_(env, it);
  return appendBuyerLead_(env, it);
}

async function closeDeal_(env, address, closedDate) {
  const found = await findRecordByKey_(env, 'active', address);
  if (!found) return { ok: false, error: 'row not found: ' + address };
  const rec = await atFetch_(env, '/' + TABLES.active.id + '/' + found.recordId, { method: 'GET' });
  const f = rec.fields;
  const fields = buildFields_({
    'Address': f['Address'], 'Agent': f['Agent'], 'Side': f['Side'],
    'Closed Date': closedDate || f['Closing Date'], 'Price': f['Price'],
    'Lead Source': f['Lead Source'], 'Status': 'Closed'
  });
  await atFetch_(env, '/' + TABLES.closed.id, { method: 'POST', body: JSON.stringify({ records: [{ fields }], typecast: true }) });
  await atFetch_(env, '/' + TABLES.active.id + '/' + found.recordId, { method: 'DELETE' });
  return { ok: true, moved: f['Address'], closedDate: closedDate || f['Closing Date'] };
}

/* ---------------- voice conversation (Claude) ---------------- */
// Ported straight from google-sheets-backend.gs's converse_ - same prompt,
// same tool schema, same rules. Only the HTTP call mechanics changed
// (fetch instead of UrlFetchApp).
async function converse_(env, data) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: 'no ANTHROPIC_API_KEY configured on this Worker' };

  const fieldDefs = data.fieldDefs || [];
  const know = data.know || {};
  const said = data.saidJustNow || '';
  const reqLines = fieldDefs.filter(f => f.req).map(f => '- ' + f.key + ': ' + f.lab).join('\n');
  const optLines = fieldDefs.filter(f => !f.req).map(f => '- ' + f.key + ': ' + f.lab).join('\n');

  const system = [
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

  const payload = {
    model: 'claude-sonnet-5',
    max_tokens: 512,
    system,
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

  let resp;
  try {
    resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    return { ok: false, error: 'request failed: ' + String(err) };
  }

  let body;
  try { body = await resp.json(); } catch (e2) { body = null; }
  if (!resp.ok || !body) {
    const msg = (body && body.error && body.error.message) || ('HTTP ' + resp.status);
    return { ok: false, error: 'Claude API error ' + resp.status + ': ' + msg };
  }

  const toolUse = (body.content || []).find(c => c.type === 'tool_use');
  if (!toolUse) return { ok: false, error: 'no structured response from Claude' };

  const out = toolUse.input || {};
  return { ok: true, fields: out.fields || {}, done: !!out.done, spokenLine: out.spokenLine || '' };
}

/* ---------------- entry point ---------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = Object.fromEntries(url.searchParams);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      if (request.method === 'GET') {
        if (p.action === 'list') {
          const payload = { ok: true, deals: await listDeals_(env) };
          return p.callback ? js_(p.callback, payload) : json_(payload);
        }
        if (p.action === 'schema') {
          const payload = { ok: true, active: ACTIVE_CATEGORIES, listings: LISTINGS_CATEGORIES, buyerleads: BUYERLEADS_CATEGORIES };
          return p.callback ? js_(p.callback, payload) : json_(payload);
        }
        if (p.action === 'closeDeal' && p.address) {
          const res = await closeDeal_(env, p.address, p.closedDate);
          return json_(res);
        }
        return json_({ ok: true, service: 'Integrity Homes Airtable backend', build: BUILD, ready: true });
      }

      if (request.method === 'POST') {
        const data = await request.json();

        if (data.action === 'save') {
          const res = await saveField_(env, data.tab, data.key, data.updates || {});
          return json_({ ok: res.ok, error: res.error || null });
        }
        if (data.action === 'intake' && data.intake) {
          const out = await routeIntake_(env, data.intake);
          return json_({ ok: true, tab: out.tab, row: out.recordId });
        }
        if (data.action === 'converse') {
          return json_(await converse_(env, data));
        }
        return json_({ ok: false, error: 'nothing to do' });
      }

      return json_({ ok: false, error: 'unsupported method: ' + request.method });
    } catch (err) {
      return json_({ ok: false, error: String(err && err.message || err) });
    }
  }
};
