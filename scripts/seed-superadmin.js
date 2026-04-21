import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

const employeeSchema = new mongoose.Schema({
  active: { type: Boolean, default: true },
  login: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  surname: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  role: { type: String, default: 'employee' },
  permissions: { type: [String], default: [] },
  avatar: { type: String, default: null },
  avatarPublicId: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

const LOGIN = 'superadmin';
const PASSWORD = process.argv[2] || 'Admin1234!';
const NAME = 'Super Admin';

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const existing = await Employee.findOne({ role: 'superadmin' });
  if (existing) {
    console.log(`Superadmin already exists (login: ${existing.login})`);
    await mongoose.disconnect();
    return;
  }

  const hash = await bcrypt.hash(PASSWORD, 12);
  await Employee.create({
    login: LOGIN,
    password: hash,
    name: NAME,
    role: 'superadmin',
    permissions: [],
    active: true,
    isVerified: true,
  });

  console.log(`Superadmin created — login: "${LOGIN}", password: "${PASSWORD}"`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
