import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    priceTypes: { type: [Number], default: [100, 150, 200, 250] },
    serviceTypes: { type: [String], default: ['Serwis', 'Konsultacja', 'Instalacja', 'Szkolenie'] },
    executionTypes: { type: [String], default: ['Zdalne', 'Na miejscu', 'Zlecenie', 'Projekt'] },
    programTypes: { type: [String], default: ['Systemy ERP', 'Systemy FK', 'Systemy kadrowe', 'Systemy magazynowe'] },
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);
