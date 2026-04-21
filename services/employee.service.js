import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import { connectDB } from '../lib/db.js';
import { Employee } from '../models/Employee.js';
import { employeeRepository } from '../repositories/employee.repository.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AVATARS_DIR = path.join(process.cwd(), 'public/uploads/avatars');

try {
  if (!fs.existsSync(AVATARS_DIR)) fs.mkdirSync(AVATARS_DIR, { recursive: true });
} catch (_) {
  // read-only filesystem (e.g. Vercel) — avatar uploads disabled
}

export const employeeService = {
  async list() {
    await connectDB();
    return employeeRepository.findAll();
  },

  async executors() {
    await connectDB();
    return employeeRepository.findExecutors();
  },

  async getById(id) {
    await connectDB();
    const emp = await employeeRepository.findById(id);
    if (!emp) throw Object.assign(new Error('Pracownik nie znaleziony'), { statusCode: 404 });
    return emp;
  },

  async create(data) {
    await connectDB();
    // Generate login from email if not provided
    if (!data.login) {
      data.login = data.email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
    }
    // Generate temp password if not provided
    if (!data.password) {
      data.password = crypto.randomBytes(8).toString('hex') + 'A1';
    }
    return employeeRepository.create(data);
  },

  async update(id, data) {
    await connectDB();
    const emp = await employeeRepository.updateById(id, data);
    if (!emp) throw Object.assign(new Error('Pracownik nie znaleziony'), { statusCode: 404 });
    return emp;
  },

  async delete(id) {
    await connectDB();
    const emp = await employeeRepository.deleteById(id);
    if (!emp) throw Object.assign(new Error('Pracownik nie znaleziony'), { statusCode: 404 });
    return { message: 'Pracownik usunięty' };
  },

  async updateProfile(userId, data) {
    await connectDB();
    const employee = await Employee.findById(userId).select('+password');
    if (!employee) throw Object.assign(new Error('Pracownik nie znaleziony'), { statusCode: 404 });

    if (data.name !== undefined) employee.name = data.name;
    if (data.surname !== undefined) employee.surname = data.surname;
    if (data.phone !== undefined) employee.phone = data.phone;

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw Object.assign(new Error('Wymagane aktualne hasło'), { statusCode: 400 });
      }
      const isMatch = await employee.comparePassword(data.currentPassword);
      if (!isMatch) {
        throw Object.assign(new Error('Aktualne hasło jest nieprawidłowe'), { statusCode: 400 });
      }
      employee.password = data.newPassword;
    }

    await employee.save();
    return employee.toJSON();
  },

  // Accepts a Buffer (used by Next.js API routes via formidable/multer)
  async uploadAvatarBuffer(userId, buffer) {
    await connectDB();
    if (!buffer) throw Object.assign(new Error('Brak pliku'), { statusCode: 400 });

    const outputFilename = `avatar-${userId}-${Date.now()}.webp`;
    const outputPath = path.join(AVATARS_DIR, outputFilename);

    await sharp(buffer)
      .resize(200, 200, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toFile(outputPath);

    const employee = await Employee.findById(userId);
    if (employee?.avatar) {
      const oldPath = path.join(process.cwd(), 'public', employee.avatar);
      fs.unlink(oldPath, () => {});
    }

    const avatarUrl = `/uploads/avatars/${outputFilename}`;
    await Employee.findByIdAndUpdate(userId, { avatar: avatarUrl });
    return { avatar: avatarUrl };
  },

  // Accepts a file object from multer (kept for compatibility)
  async uploadAvatar(userId, file) {
    await connectDB();
    if (!file) throw Object.assign(new Error('Brak pliku'), { statusCode: 400 });

    const outputFilename = `avatar-${userId}-${Date.now()}.webp`;
    const outputPath = path.join(AVATARS_DIR, outputFilename);

    // Process: resize to 200x200 using sharp + save as webp
    await sharp(file.path)
      .resize(200, 200, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toFile(outputPath);

    // Remove original upload if different from output
    if (file.path !== outputPath) {
      fs.unlink(file.path, () => {});
    }

    // Remove old avatar
    const employee = await Employee.findById(userId);
    if (employee?.avatar) {
      const oldPath = path.join(process.cwd(), 'public', employee.avatar);
      fs.unlink(oldPath, () => {});
    }

    const avatarUrl = `/uploads/avatars/${outputFilename}`;
    await Employee.findByIdAndUpdate(userId, { avatar: avatarUrl });

    return { avatar: avatarUrl };
  },
};
