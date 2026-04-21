import mongoose from 'mongoose';

const programSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    categories: { type: [String], default: [] },
  },
  { timestamps: true }
);

programSchema.index({ name: 1 });

export const Program = mongoose.models.Program || mongoose.model('Program', programSchema);
