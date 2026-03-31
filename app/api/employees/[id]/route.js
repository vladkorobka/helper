import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { getAuthUser, attachAuthCookie, requireRole } from '../../../../lib/auth.js';
import { employeeService } from '../../../../services/employee.service.js';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requireRole(user, 'superadmin');
    const employee = await employeeService.getById(id);
    const response = NextResponse.json(employee);
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requireRole(user, 'superadmin');
    const body = await request.json();
    const employee = await employeeService.update(id, body);
    const response = NextResponse.json(employee);
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requireRole(user, 'superadmin');
    const result = await employeeService.delete(id);
    const response = NextResponse.json(result);
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
