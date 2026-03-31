import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db.js';
import { getAuthUser, attachAuthCookie, requireRole } from '../../../lib/auth.js';
import { employeeService } from '../../../services/employee.service.js';

export async function GET(request) {
  try {
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requireRole(user, 'superadmin');
    const employees = await employeeService.list();
    const response = NextResponse.json(employees);
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requireRole(user, 'superadmin');
    const body = await request.json();
    const employee = await employeeService.create(body);
    const response = NextResponse.json(employee, { status: 201 });
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
