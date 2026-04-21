import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['employee'],
      default: 'employee',
    },
    permissions: {
      type: [String],
      enum: ['tickets', 'clients', 'programs'],
      default: ['tickets'],
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    usedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// token index is declared via unique:true on the field itself
inviteSchema.index({ email: 1 });
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Invite = mongoose.models.Invite || mongoose.model('Invite', inviteSchema);
