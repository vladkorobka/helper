import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { getAuthUser, attachAuthCookie } from '../../../../lib/auth.js';
import { employeeService } from '../../../../services/employee.service.js';

export async function GET(request) {
  try {
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    const employee = await employeeService.getById(user._id);
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

export async function PUT(request) {
  try {
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    const body = await request.json();
    const employee = await employeeService.updateProfile(user._id, body);
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
