import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node scripts/import-clients-csv.mjs <path-to-csv>');
  process.exit(1);
}

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
    nip: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: [String], validate: [(v) => v.length >= 1, 'At least one contact person required'] },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    notes: { type: String, default: '' },
    tags: { type: [String], default: [] },
    programs: { type: [clientProgramSchema], default: [] },
  },
  { timestamps: true },
);

const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);

const NBSP = / /g;

function parseLine(line) {
  const fields = line.split('";"');
  if (fields.length === 0) return null;
  fields[0] = fields[0].replace(/^"/, '');
  fields[fields.length - 1] = fields[fields.length - 1].replace(/"$/, '');
  return fields;
}

function clean(value) {
  if (value == null) return '';
  return String(value).replace(NBSP, ' ').trim();
}

function cleanNotes(value) {
  if (value == null) return '';
  return String(value).replace(/~/g, '\n').replace(NBSP, ' ').trim();
}

async function run() {
  const raw = readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  const dataLines = lines.slice(1);

  console.log(`Parsing ${dataLines.length} rows from ${csvPath}`);

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  let imported = 0;
  let skippedExisting = 0;
  let failed = 0;

  for (let i = 0; i < dataLines.length; i++) {
    const fields = parseLine(dataLines[i]);
    if (!fields || fields.length < 7) {
      console.warn(`[line ${i + 2}] malformed, skip`);
      failed++;
      continue;
    }

    const [, shortcut, name, email, phone, person, notes] = fields;

    const code = clean(shortcut);
    if (!code) {
      console.warn(`[line ${i + 2}] empty shortcut, skip`);
      failed++;
      continue;
    }

    const existing = await Client.findOne({ code });
    if (existing) {
      skippedExisting++;
      continue;
    }

    const personClean = clean(person);
    const doc = {
      code,
      name: clean(name) || code,
      email: clean(email).toLowerCase(),
      phone: clean(phone),
      contactPerson: [personClean || '—'],
      notes: cleanNotes(notes),
      nip: '',
      address: '',
      tags: [],
      programs: [],
    };

    try {
      await Client.create(doc);
      imported++;
    } catch (err) {
      console.error(`[line ${i + 2}] failed (${code}): ${err.message}`);
      failed++;
    }
  }

  console.log('---');
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (already exist): ${skippedExisting}`);
  console.log(`Failed: ${failed}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
