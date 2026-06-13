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

    if (field === 'priceTypes') {
      const usedBy = [];
      for (const [cat, price] of settings.categoryPriceDefaults.entries()) {
        if (Number(price) === Number(value)) usedBy.push(cat);
      }
      if (usedBy.length) {
        throw Object.assign(
          new Error(
            `Cena ${value} zł/h jest domyślną dla kategorii: ${usedBy.join(', ')}. Najpierw zmień je na inną.`,
          ),
          { statusCode: 409 },
        );
      }
    }

    settings[field] = settings[field].filter((v) => String(v) !== String(value));

    if (field === 'executionTypes' && settings.categoryPriceDefaults.has(value)) {
      settings.categoryPriceDefaults.delete(value);
    }

    await settings.save();
    return settings;
  },

  async setCategoryDefault(category, priceType) {
    await connectDB();
    const settings = await this.get();
    if (!settings.executionTypes.includes(category)) {
      throw Object.assign(new Error('Nieznana kategoria'), { statusCode: 400 });
    }
    if (priceType === null || priceType === '' || priceType === undefined) {
      settings.categoryPriceDefaults.delete(category);
    } else {
      const num = Number(priceType);
      if (!settings.priceTypes.includes(num)) {
        throw Object.assign(new Error('Cena nie istnieje w stawkach'), {
          statusCode: 400,
        });
      }
      settings.categoryPriceDefaults.set(category, num);
    }
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
