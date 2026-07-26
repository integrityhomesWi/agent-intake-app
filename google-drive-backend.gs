/**
 * Integrity Homes - Agent Intake: Google Drive backend
 * ----------------------------------------------------
 * A small Google Apps Script that receives an intake file from the app and
 * files it into the Deal-Files folder in Google Drive. It runs as John's
 * Google account, so agents never have to log into anything.
 *
 * SETUP (one time):
 *   1. Go to script.google.com signed in as john@integrityhomeswi.com
 *   2. New project, delete the sample, paste this whole file in, Save.
 *   3. Deploy > New deployment > type "Web app".
 *        - Execute as: Me (john@integrityhomeswi.com)
 *        - Who has access: Anyone
 *   4. Authorize when prompted.
 *   5. Copy the Web app URL (ends in /exec) and give it to Claude Code.
 */

// Deal-Files folder in Google Drive (from CLAUDE.md).
var DEAL_FILES_FOLDER_ID = '1ybN83Xpqq_0bWyEhASKzangkp45xF2XS';

// Optional shared password. Leave "" for none. If you set one here, set the
// same word as DRIVE_SECRET in index.html so random posts get rejected.
var SHARED_SECRET = '';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (SHARED_SECRET && data.secret !== SHARED_SECRET) {
      return json_({ ok: false, error: 'unauthorized' });
    }

    var name = sanitizeName_(data.name || 'INTAKE-Unknown.md');
    var body = String(data.body || '');
    var folder = DriveApp.getFolderById(DEAL_FILES_FOLDER_ID);

    // One file per client/property, current-state (not append-only):
    // if a file with the same name already exists, overwrite it.
    var existing = folder.getFilesByName(name);
    var file;
    if (existing.hasNext()) {
      file = existing.next();
      file.setContent(body);
    } else {
      file = folder.createFile(name, body, MimeType.PLAIN_TEXT);
    }

    return json_({ ok: true, id: file.getId(), name: name });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Lets you open the /exec URL in a browser to confirm the helper is alive.
function doGet() {
  return json_({ ok: true, service: 'Integrity Homes intake backend', ready: true });
}

function sanitizeName_(n) {
  n = String(n).replace(/[\/\\:*?"<>|]/g, '-');
  if (!/\.md$/i.test(n)) n += '.md';
  return n;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
