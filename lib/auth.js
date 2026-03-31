import { NextResponse } from 'next/server';
import { connectDB } from './db.js';
import { verifyToken, signToken, COOKIE_NAME, tokenCookieOptions } from './jwt.js';

async function loadEmployee() {
  const { Employee } = await import('../models/Employee.js');
  return Employee;
}

/**
 * Verify JWT from request cookie, load employee from DB, issue refreshed token.
 * Returns { user, newToken } or throws { status, message }.
 */
export async function getAuthUser(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) throw { status: 401, message: 'Nie zalogowany' };

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw { status: 401, message: 'Sesja wygasła, zaloguj się ponownie' };
  }

  await connectDB();
  const Employee = await loadEmployee();
  const employee = await Employee.findById(decoded.id).select('-password');
  if (!employee || !employee.active) {
    throw { status: 401, message: 'Konto nieaktywne lub usunięte' };
  }

  const newToken = signToken({
    id: employee._id,
    role: employee.role,
    permissions: employee.permissions,
  });

  return { user: employee, newToken };
}

/**
 * Attach refreshed token cookie to an existing NextResponse.
 */
export function attachAuthCookie(response, token) {
  response.cookies.set(COOKIE_NAME, token, tokenCookieOptions());
  return response;
}

/**
 * Return a JSON error response.
 */
export function authError(message, status = 401) {
  return NextResponse.json({ message }, { status });
}

/**
 * Throw if user does not have one of the required roles.
 */
export function requireRole(user, ...roles) {
  if (!roles.includes(user.role)) {
    throw { status: 403, message: 'Brak uprawnień' };
  }
}

/**
 * Throw if user lacks the required permission (superadmin always passes).
 */
export function requirePermission(user, permission) {
  if (user.role === 'superadmin') return;
  if (!user.permissions.includes(permission)) {
    throw { status: 403, message: 'Brak uprawnień do tej sekcji' };
  }
}
