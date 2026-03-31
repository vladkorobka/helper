import crypto from 'crypto';
import { connectDB } from '../lib/db.js';
import { Employee } from '../models/Employee.js';
import { Invite } from '../models/Invite.js';
import { employeeRepository } from '../repositories/employee.repository.js';
import { signToken } from '../lib/jwt.js';
import { sendInviteEmail, sendResetPasswordEmail } from './email.service.js';

const CLIENT_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const authService = {
  async login(login, password) {
    await connectDB();
    const employee = await employeeRepository.findByLogin(login);
    if (!employee || !employee.active) {
      throw Object.assign(new Error('Nieprawidłowe dane logowania'), { statusCode: 401 });
    }

    // Always check password — no bypass
    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      throw Object.assign(new Error('Nieprawidłowe dane logowania'), { statusCode: 401 });
    }

    const token = signToken({
      id: employee._id,
      role: employee.role,
      permissions: employee.permissions,
    });

    const user = employee.toJSON();
    delete user.password;

    return { token, user };
  },

  async getMe(userId) {
    await connectDB();
    const employee = await Employee.findById(userId).select('-password');
    if (!employee) throw Object.assign(new Error('Nie znaleziono użytkownika'), { statusCode: 404 });
    return employee;
  },

  // ── Invites ──────────────────────────────────────────────────────────────

  async createInvite({ email, name, role, permissions, invitedBy }) {
    await connectDB();
    // Check if email is already in use
    const existing = await Employee.findOne({ email });
    if (existing) {
      throw Object.assign(new Error('Użytkownik z tym adresem email już istnieje'), { statusCode: 409 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Remove any previous unused invite for this email
    await Invite.deleteMany({ email, usedAt: null });

    await Invite.create({ email, name, token, role, permissions, invitedBy, expiresAt });

    const inviteUrl = `${CLIENT_URL}/accept-invite?token=${token}`;
    await sendInviteEmail({ to: email, name, inviteUrl });

    return { message: 'Zaproszenie wysłane' };
  },

  async acceptInvite({ token, password, name, surname, phone }) {
    await connectDB();
    const invite = await Invite.findOne({ token, usedAt: null });
    if (!invite || invite.expiresAt < new Date()) {
      throw Object.assign(new Error('Zaproszenie wygasło lub jest nieprawidłowe'), { statusCode: 400 });
    }

    // Create login from email (before @)
    const loginBase = invite.email.split('@')[0].replace(/[^a-z0-9]/g, '');
    let login = loginBase;
    let counter = 1;
    while (await Employee.findOne({ login })) {
      login = `${loginBase}${counter++}`;
    }

    const employee = await Employee.create({
      login,
      password,
      email: invite.email,
      name,
      surname,
      phone,
      role: invite.role,
      permissions: invite.permissions,
      isVerified: true,
      active: true,
    });

    await Invite.findByIdAndUpdate(invite._id, { usedAt: new Date() });

    const jwtToken = signToken({
      id: employee._id,
      role: employee.role,
      permissions: employee.permissions,
    });

    return { token: jwtToken, user: employee.toJSON() };
  },

  async getInviteInfo(token) {
    await connectDB();
    const invite = await Invite.findOne({ token, usedAt: null });
    if (!invite || invite.expiresAt < new Date()) {
      throw Object.assign(new Error('Zaproszenie wygasło lub jest nieprawidłowe'), { statusCode: 400 });
    }
    return { name: invite.name, email: invite.email };
  },

  async listPendingInvites() {
    await connectDB();
    return Invite.find({ usedAt: null, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .select('email name permissions createdAt expiresAt');
  },

  async resendInvite({ inviteId, email }) {
    await connectDB();
    const invite = await Invite.findById(inviteId);
    if (!invite || invite.usedAt) {
      throw Object.assign(new Error('Zaproszenie nie istnieje lub zostało już wykorzystane'), { statusCode: 404 });
    }

    const targetEmail = (email || invite.email).toLowerCase().trim();

    if (targetEmail !== invite.email) {
      const existing = await Employee.findOne({ email: targetEmail });
      if (existing) {
        throw Object.assign(new Error('Użytkownik z tym adresem email już istnieje'), { statusCode: 409 });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Invite.findByIdAndUpdate(inviteId, { email: targetEmail, token, expiresAt });

    const inviteUrl = `${CLIENT_URL}/accept-invite?token=${token}`;
    await sendInviteEmail({ to: targetEmail, name: invite.name, inviteUrl });

    return { message: 'Zaproszenie wysłane ponownie' };
  },

  // ── Password Reset ────────────────────────────────────────────────────────

  async forgotPassword(email) {
    await connectDB();
    const employee = await Employee.findOne({ email });
    // Always return success to prevent email enumeration
    if (!employee) return { message: 'Jeśli email istnieje, wysłaliśmy link resetujący' };

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await Employee.findByIdAndUpdate(employee._id, {
      resetToken: token,
      resetExpires: expires,
    });

    const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;
    await sendResetPasswordEmail({ to: email, name: employee.name, resetUrl });

    return { message: 'Jeśli email istnieje, wysłaliśmy link resetujący' };
  },

  async resetPassword(token, password) {
    await connectDB();
    const employee = await Employee.findOne({
      resetToken: token,
      resetExpires: { $gt: new Date() },
    }).select('+resetToken +resetExpires');

    if (!employee) {
      throw Object.assign(new Error('Token resetowania jest nieprawidłowy lub wygasł'), { statusCode: 400 });
    }

    employee.password = password;
    employee.resetToken = undefined;
    employee.resetExpires = undefined;
    await employee.save();

    return { message: 'Hasło zostało zmienione' };
  },
};
