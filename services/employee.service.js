import crypto from 'crypto';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { connectDB } from '../lib/db.js';
import { Employee } from '../models/Employee.js';
import { employeeRepository } from '../repositories/employee.repository.js';

cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });

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
    if (!data.login) {
      data.login = data.email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
    }
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

  async uploadAvatarBuffer(userId, buffer) {
    await connectDB();
    if (!buffer) throw Object.assign(new Error('Brak pliku'), { statusCode: 400 });

    const webpBuffer = await sharp(buffer)
      .resize(200, 200, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer();

    const employee = await Employee.findById(userId);

    // Delete old avatar from Cloudinary
    if (employee?.avatarPublicId) {
      await cloudinary.uploader.destroy(employee.avatarPublicId).catch(() => {});
    }

    const uploaded = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'helper/avatars', public_id: `avatar-${userId}`, overwrite: true },
        (err, result) => (err ? reject(err) : resolve(result))
      ).end(webpBuffer);
    });

    await Employee.findByIdAndUpdate(userId, {
      avatar: uploaded.secure_url,
      avatarPublicId: uploaded.public_id,
    });

    return { avatar: uploaded.secure_url };
  },
};
