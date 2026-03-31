import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employeeSchema = new mongoose.Schema(
  {
    active: { type: Boolean, default: true },
    login: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    surname: { type: String, trim: true, default: '' },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      sparse: true,
    },
    phone: { type: String, trim: true, default: '' },
    role: {
      type: String,
      enum: ['superadmin', 'employee'],
      default: 'employee',
    },
    permissions: {
      type: [String],
      enum: ['tickets', 'clients', 'programs'],
      default: ['tickets'],
    },
    avatar: { type: String, default: null },
    // Invite/onboarding
    isVerified: { type: Boolean, default: false },
    inviteToken: { type: String, select: false },
    inviteExpires: { type: Date, select: false },
    // Password reset
    resetToken: { type: String, select: false },
    resetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Indexes (email index is declared via sparse:true on the field itself)
employeeSchema.index({ role: 1 });

// Hash password before save
employeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

employeeSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

employeeSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.password;
    delete ret.inviteToken;
    delete ret.inviteExpires;
    delete ret.resetToken;
    delete ret.resetExpires;
    return ret;
  },
});

export const Employee = mongoose.model('Employee', employeeSchema);
