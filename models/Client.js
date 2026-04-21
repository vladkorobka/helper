import mongoose from 'mongoose';

const clientProgramSchema = new mongoose.Schema(
  {
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    version: { type: String, default: '' },
    employee: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  { _id: false }
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
  { timestamps: true }
);

// Indexes for common query patterns
clientSchema.index({ name: 1 });
clientSchema.index({ nip: 1 });
clientSchema.index({ tags: 1 });
clientSchema.index({ 'programs.program': 1 });

export const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);
