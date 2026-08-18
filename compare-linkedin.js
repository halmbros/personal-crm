const fs = require('fs');

// --- Parse LinkedIn CSV ---
const csvRaw = fs.readFileSync('C:/Users/migue/OneDrive/Desktop/Connections Linkedin.csv', 'utf-8');
const lines = csvRaw.split('\n');

let headerIdx = lines.findIndex(l => l.startsWith('First Name,Last Name,'));
if (headerIdx < 0) { console.error('No header found'); process.exit(1); }

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

// --- Parse CRM names from sheet JSON ---
const sheetJson = fs.readFileSync('C:/Users/migue/.claude/projects/C--Users-migue/07cacd3c-8215-47a7-b5af-4cb0d54ab0ae/tool-results/toolu_016t8wx4PsJAYe46cQJcbi4w.txt', 'utf-8');
const jsonStart = sheetJson.indexOf('{');
const jsonEnd = sheetJson.lastIndexOf('}');
const data = JSON.parse(sheetJson.slice(jsonStart, jsonEnd + 1));
const rows = data.values || [];

const crmNames = new Set();
for (const row of rows) {
  if (!row || row.length < 3) continue;
  const name = (row[2] || '').trim().replace(/\t/g, '').replace(/\n/g, '');
  if (name && !name.startsWith('[') && name !== 'Task' && name !== 'Name') {
    crmNames.add(name);
  }
}

// --- Normalize for matching ---
function normalize(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const crmNormalized = new Set();
for (const n of crmNames) crmNormalized.add(normalize(n));

const crmFirstLast = new Set();
for (const n of crmNames) {
  const parts = normalize(n).split(' ');
  if (parts.length >= 2) crmFirstLast.add(parts[0] + ' ' + parts[parts.length - 1]);
}

// --- Date filter: since Dec 1, 2023 ---
const cutoff = new Date('2023-12-01');

function parseConnDate(s) {
  if (!s) return new Date(0);
  const d = new Date(s.replace(/-/g, ' '));
  if (!isNaN(d)) return d;
  return new Date(0);
}

// --- Find new LinkedIn connections not in CRM, since Dec 2023 ---
const newContacts = [];
for (const c of linkedinContacts) {
  const connDate = parseConnDate(c.connectedOn);
  if (connDate < cutoff) continue; // skip older connections

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

// --- Output ---
console.log(`\n=== LINKEDIN vs CRM (since Dec 2023) ===`);
console.log(`Total LinkedIn connections since Dec 2023: ${linkedinContacts.filter(c => parseConnDate(c.connectedOn) >= cutoff).length}`);
console.log(`Already in CRM: ${linkedinContacts.filter(c => parseConnDate(c.connectedOn) >= cutoff).length - newContacts.length}`);
console.log(`NEW (not in CRM): ${newContacts.length}`);
console.log(`\n=== ALL NEW CONNECTIONS SINCE DEC 2023 ===\n`);

for (const c of newContacts) {
  console.log(`${c.connectedOn.padEnd(14)} | ${c.fullName.padEnd(35)} | ${(c.company || '').padEnd(40)} | ${c.position || ''}`);
}

// --- Write CSV for Google Sheets import ---
// Format: columns match CRM sheet: A(empty), B(empty), C(Name), D(Firm), E(Position), F(Location empty), G(Contact Quality empty), H(Status), I(Plan), J(Contact Note), K(Motive empty), L(Reached Out), M(Result)
const sheetRows = ['Name,Firm,Position in Firm,Location,Contact Quality,Status,Plan,Contact/Status Note,Motive,Reached Out,Result of Reachouts,Next Date,Notes,LinkedIn URL,Email,Connected On'];
for (const c of newContacts) {
  const row = [
    c.fullName,           // Name
    c.company || '',      // Firm
    c.position || '',     // Position in Firm
    '',                   // Location
    '',                   // Contact Quality
    '',                   // Status
    '',                   // Plan
    '',                   // Contact/Status Note
    '',                   // Motive
    '',                   // Reached Out
    '',                   // Result
    '',                   // Next Date
    `LinkedIn: ${c.url || ''}`, // Notes
    c.url || '',          // LinkedIn URL (extra)
    c.email || '',        // Email (extra)
    c.connectedOn || ''   // Connected On (extra)
  ].map(v => `"${(v||'').replace(/"/g, '""')}"`);
  sheetRows.push(row.join(','));
}
fs.writeFileSync('C:/Users/migue/personal-crm/linkedin-new-since-dec2023.csv', sheetRows.join('\n'), 'utf-8');
console.log(`\nCSV written to: personal-crm/linkedin-new-since-dec2023.csv`);
console.log(`Ready to import into Google Sheet or review for flagging.`);
