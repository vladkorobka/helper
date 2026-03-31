import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { getAuthUser, attachAuthCookie } from '../../../../lib/auth.js';
import { employeeService } from '../../../../services/employee.service.js';

export async function GET(request) {
  try {
    await connectDB();
    const { newToken } = await getAuthUser(request);
    const executors = await employeeService.executors();
    const response = NextResponse.json(executors);
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
