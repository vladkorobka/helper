import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

// ---- CLI args -------------------------------------------------------------
// Usage: node scripts/import-client-programs.mjs [csvDir] [--apply]
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const csvDir =
  args.find((a) => !a.startsWith('--')) ||
  'C:/Users/Vlad/OneDrive/Pulpit';

const files = {
  users: join(csvDir, 'users.csv'),
  programs: join(csvDir, 'programs.csv'),
  clients: join(csvDir, 'clients.csv'),
  connection: join(csvDir, 'kh_pr_connection.csv'),
};

// ---- Minimal models (script-local, same shape as app) ---------------------
const clientProgramSchema = new mongoose.Schema(
  {
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    version: { type: String, default: '' },
    employee: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  { _id: false },
);
const clientSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    programs: { type: [clientProgramSchema], default: [] },
  },
  { timestamps: true, strict: false },
);
const programSchema = new mongoose.Schema(
  { code: String, name: String },
  { timestamps: true, strict: false },
);
const employeeSchema = new mongoose.Schema(
  { login: String, name: String, surname: String },
  { timestamps: true, strict: false },
);

const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);
const Program = mongoose.models.Program || mongoose.model('Program', programSchema);
const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

// ---- Robust CSV parser (delimiter ';', quotes '"', escaped '""') ----------
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ';') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      // skip fully empty trailing rows
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
  }
  return rows;
}

function readCsvAsObjects(path) {
  const rows = parseCsv(readFileSync(path, 'utf8'));
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, idx) => (obj[h] = (r[idx] ?? '').trim()));
    return obj;
  });
}

async function run() {
  console.log('='.repeat(60));
  console.log(`RUN MODE: ${APPLY ? 'APPLY (writing to DB)' : 'DRY-RUN (no writes)'}`);
  console.log(`CSV dir : ${csvDir}`);
  console.log('='.repeat(60));

  const usersCsv = readCsvAsObjects(files.users);
  const programsCsv = readCsvAsObjects(files.programs);
  const clientsCsv = readCsvAsObjects(files.clients);
  const connCsv = readCsvAsObjects(files.connection);

  console.log(
    `CSV rows → users:${usersCsv.length} programs:${programsCsv.length} ` +
      `clients:${clientsCsv.length} connections:${connCsv.length}`,
  );

  // CSV id → reference key
  const clientCodeById = new Map(clientsCsv.map((c) => [c.id, c.shortcut]));
  const programCodeById = new Map(programsCsv.map((p) => [p.id, p.shortcut]));
  const userEmailById = new Map(usersCsv.map((u) => [u.id, u.email]));

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Mongo lookups
  const clientByCode = new Map();
  for (const c of await Client.find({}, { code: 1, programs: 1 }))
    clientByCode.set(c.code, c);

  const programIdByCode = new Map();
  for (const p of await Program.find({}, { code: 1 }))
    programIdByCode.set(p.code, p._id);

  const employeeNameByLogin = new Map();
  for (const e of await Employee.find({}, { login: 1, name: 1, surname: 1 }))
    employeeNameByLogin.set(
      (e.login || '').toLowerCase(),
      `${e.name || ''} ${e.surname || ''}`.trim(),
    );

  // Diagnostics accumulators
  const missing = {
    clientCsvId: new Set(),
    clientCode: new Set(),
    programCsvId: new Set(),
    programCode: new Set(),
    userCsvId: new Set(),
    userLogin: new Set(),
  };

  // Group connections by mongo Client doc
  const additionsByClient = new Map(); // clientDoc -> entries[]
  let totalRows = 0;
  let resolvedRows = 0;
  const dropped = {
    clientCsvId: 0,
    clientCode: 0,
    programCsvId: 0,
    programCode: 0,
  };

  for (const conn of connCsv) {
    totalRows++;
    const code = clientCodeById.get(conn.client_id);
    if (code === undefined) {
      missing.clientCsvId.add(conn.client_id);
      dropped.clientCsvId++;
      continue;
    }
    const clientDoc = clientByCode.get(code);
    if (!clientDoc) {
      missing.clientCode.add(code);
      dropped.clientCode++;
      continue;
    }

    const progCode = programCodeById.get(conn.program_id);
    if (progCode === undefined) {
      missing.programCsvId.add(conn.program_id);
      dropped.programCsvId++;
      continue;
    }
    const programId = programIdByCode.get(progCode);
    if (!programId) {
      missing.programCode.add(progCode);
      dropped.programCode++;
      continue;
    }

    // employee is optional — keep the entry even if user not matched
    let employee = '';
    const userEmail = userEmailById.get(conn.user_id);
    if (userEmail === undefined) {
      missing.userCsvId.add(conn.user_id);
    } else {
      const name = employeeNameByLogin.get(userEmail.toLowerCase());
      if (name === undefined) missing.userLogin.add(userEmail.toLowerCase());
      else employee = name;
    }

    const entry = {
      program: programId,
      version: conn.program_version || '',
      employee,
      email: conn.person_email || '',
    };

    if (!additionsByClient.has(clientDoc)) additionsByClient.set(clientDoc, []);
    additionsByClient.get(clientDoc).push(entry);
    resolvedRows++;
  }

  // Merge into client docs with de-duplication (idempotent re-runs)
  const keyOf = (e) =>
    `${e.program.toString()}|${e.version}|${e.employee}|${e.email}`;

  let clientsUpdated = 0;
  let entriesAdded = 0;
  let entriesSkippedDup = 0;

  for (const [clientDoc, entries] of additionsByClient) {
    const existingKeys = new Set((clientDoc.programs || []).map(keyOf));
    const toAdd = [];
    for (const e of entries) {
      const k = keyOf(e);
      if (existingKeys.has(k)) {
        entriesSkippedDup++;
        continue;
      }
      existingKeys.add(k);
      toAdd.push(e);
    }
    if (!toAdd.length) continue;
    entriesAdded += toAdd.length;
    clientsUpdated++;
    if (APPLY) {
      await Client.updateOne(
        { _id: clientDoc._id },
        { $push: { programs: { $each: toAdd } } },
      );
    }
  }

  // ---- Report -------------------------------------------------------------
  const list = (set) =>
    set.size ? [...set].slice(0, 50).join(', ') + (set.size > 50 ? ' …' : '') : '—';

  console.log('--- RESULT ---');
  console.log(`Connection rows total      : ${totalRows}`);
  console.log(`Rows resolved (client+prog): ${resolvedRows}`);
  console.log(`Clients to update          : ${clientsUpdated}`);
  console.log(`Program entries to add     : ${entriesAdded}`);
  console.log(`Entries skipped (dup)      : ${entriesSkippedDup}`);
  console.log('');
  console.log('--- WARNINGS (distinct codes / dropped rows) ---');
  console.log(`Unknown client_id (CSV)    : ${missing.clientCsvId.size} codes / ${dropped.clientCsvId} rows  ${list(missing.clientCsvId)}`);
  console.log(`Client code not in Mongo   : ${missing.clientCode.size} codes / ${dropped.clientCode} rows  ${list(missing.clientCode)}`);
  console.log(`Unknown program_id (CSV)   : ${missing.programCsvId.size} codes / ${dropped.programCsvId} rows  ${list(missing.programCsvId)}`);
  console.log(`Program code not in Mongo  : ${missing.programCode.size} codes / ${dropped.programCode} rows  ${list(missing.programCode)}`);
  console.log(`Unknown user_id (CSV)      : ${missing.userCsvId.size}  ${list(missing.userCsvId)}`);
  console.log(`User login not in Mongo    : ${missing.userLogin.size}  ${list(missing.userLogin)}  (entry still kept, employee='')`);
  console.log('');
  console.log('='.repeat(60));
  console.log(
    APPLY
      ? `APPLIED: ${entriesAdded} program entries written to ${clientsUpdated} clients.`
      : 'DRY-RUN complete — no data written. Re-run with --apply to write.',
  );
  console.log('='.repeat(60));

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
