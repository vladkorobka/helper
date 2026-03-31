import { connectDB } from '../lib/db.js';
import { Settings } from '../models/Settings.js';

export const settingsService = {
  async get() {
    await connectDB();
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    return settings;
  },

  async addType(field, value) {
    await connectDB();
    const settings = await this.get();
    const allowed = ['priceTypes', 'serviceTypes', 'executionTypes', 'programTypes'];
    if (!allowed.includes(field)) {
      throw Object.assign(new Error('Nieprawidłowe pole'), { statusCode: 400 });
    }
    if (!settings[field].includes(value)) {
      settings[field].push(value);
      await settings.save();
    }
    return settings;
  },

  async removeType(field, value) {
    await connectDB();
    const settings = await this.get();
    const allowed = ['priceTypes', 'serviceTypes', 'executionTypes', 'programTypes'];
    if (!allowed.includes(field)) {
      throw Object.assign(new Error('Nieprawidłowe pole'), { statusCode: 400 });
    }
    settings[field] = settings[field].filter((v) => String(v) !== String(value));
    await settings.save();
    return settings;
  },

  async update(data) {
    await connectDB();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(data);
    } else {
      Object.assign(settings, data);
      await settings.save();
    }
    return settings;
  },
};
