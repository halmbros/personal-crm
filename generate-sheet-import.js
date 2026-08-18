const fs = require('fs');

// --- Parse LinkedIn CSV ---
const csvRaw = fs.readFileSync('C:/Users/migue/OneDrive/Desktop/Connections Linkedin.csv', 'utf-8');
const lines = csvRaw.split('\n');

let headerIdx = lines.findIndex(l => l.startsWith('First Name,Last Name,'));
const linkedinContacts = [];
for (let i = headerIdx + 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const fields = [];
  let cur = '', inQ = false;
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { fields.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  fields.push(cur.trim());
  const [firstName, lastName, url, email, company, position, connectedOn] = fields;
  if (!firstName && !lastName) continue;
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  linkedinContacts.push({ firstName, lastName, fullName, url, email, company, position, connectedOn });
}

// --- Parse CRM names ---
const sheetJson = fs.readFileSync('C:/Users/migue/.claude/projects/C--Users-migue/07cacd3c-8215-47a7-b5af-4cb0d54ab0ae/tool-results/toolu_016t8wx4PsJAYe46cQJcbi4w.txt', 'utf-8');
const jsonStart = sheetJson.indexOf('{');
const jsonEnd = sheetJson.lastIndexOf('}');
const data = JSON.parse(sheetJson.slice(jsonStart, jsonEnd + 1));
const rows = data.values || [];

const crmNames = new Set();
for (const row of rows) {
  if (!row || row.length < 3) continue;
  const name = (row[2] || '').trim().replace(/\t/g, '').replace(/\n/g, '');
  if (name && !name.startsWith('[') && name !== 'Task' && name !== 'Name') crmNames.add(name);
}

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}
const crmNormalized = new Set();
for (const n of crmNames) crmNormalized.add(normalize(n));
const crmFirstLast = new Set();
for (const n of crmNames) {
  const parts = normalize(n).split(' ');
  if (parts.length >= 2) crmFirstLast.add(parts[0] + ' ' + parts[parts.length - 1]);
}

const cutoff = new Date('2023-12-01');
function parseConnDate(s) {
  if (!s) return new Date(0);
  const d = new Date(s.replace(/-/g, ' '));
  return !isNaN(d) ? d : new Date(0);
}

const newContacts = [];
for (const c of linkedinContacts) {
  const connDate = parseConnDate(c.connectedOn);
  if (connDate < cutoff) continue;
  const norm = normalize(c.fullName);
  const firstLast = norm.split(' ');
  const fl = firstLast.length >= 2 ? firstLast[0] + ' ' + firstLast[firstLast.length - 1] : norm;
  if (crmNormalized.has(norm)) continue;
  if (crmFirstLast.has(fl)) continue;
  let found = false;
  for (const cn of crmNormalized) {
    if (cn.includes(firstLast[0]) && firstLast.length > 1 && cn.includes(firstLast[firstLast.length - 1])) {
      found = true; break;
    }
  }
  if (found) continue;
  newContacts.push({ ...c, connDate });
}
newContacts.sort((a, b) => b.connDate - a.connDate);

// --- Generate TSV matching sheet structure ---
// Sheet columns: A(empty/checkbox) B(Done/section) C(Name) D(Firm) E(Position) F(Location) G(Contact Quality) H(Status) I(Plan) J(Contact/Status Note) K(Motive) L(Reached Out) M(Result of Reachouts)
// Note: The RANGE in CRM is A:M (13 columns)

const tsvLines = [];

// Section header row
tsvLines.push(['', 'LinkedIn Import (Dec 2023+)', '', '', '', '', '', '', '', '', '', '', ''].join('\t'));

// Empty row after header
tsvLines.push(['', '', '', '', '', '', '', '', '', '', '', '', ''].join('\t'));

// Column header row (matching existing sheet format)
tsvLines.push(['', '', 'Name', 'Firm', 'Position in Firm', 'Location', 'Contact Quality', 'Status', 'Plan', 'Contact/Status Note', 'Motive', 'Reached Out', 'Result of Reachouts'].join('\t'));

// Contact rows
for (const c of newContacts) {
  const row = [
    '',                           // A - empty
    '',                           // B - Done checkbox
    c.fullName,                   // C - Name
    c.company || '',              // D - Firm
    c.position || '',             // E - Position in Firm
    '',                           // F - Location
    '',                           // G - Contact Quality
    '',                           // H - Status (user will flag)
    '',                           // I - Plan
    `Connected ${c.connectedOn}`, // J - Contact/Status Note
    '',                           // K - Motive
    'LinkedIn',                   // L - Reached Out
    `LinkedIn: ${c.url || ''}`    // M - Result of Reachouts (storing URL here for ref)
  ];
  tsvLines.push(row.join('\t'));
}

const tsv = tsvLines.join('\n');
fs.writeFileSync('C:/Users/migue/personal-crm/linkedin-import-for-sheet.tsv', tsv, 'utf-8');

console.log(`Generated ${newContacts.length} rows for Google Sheets import.`);
console.log(`File: personal-crm/linkedin-import-for-sheet.tsv`);
console.log(`\nTo import into your CRM Google Sheet:`);
console.log(`1. Open https://docs.google.com/spreadsheets/d/YOUR_GOOGLE_SHEET_ID`);
console.log(`2. Go to the last row of the "To Dos 2026" tab`);
console.log(`3. Click cell A${rows.length + 1}`);
console.log(`4. Paste the TSV content (Ctrl+V) — Google Sheets will auto-split by tabs`);
console.log(`\nAlternatively, File > Import > Upload > select the TSV > "Append to current sheet"`);

// Also try to use Google Sheets API to append directly
// We need an access token for write access, API key is read-only
// Let's try appending via a simple curl command the user can run
console.log(`\n--- OR use this approach to append via API ---`);
console.log(`You'll need to sign in via OAuth in the CRM app first, then we can use the token.`);
