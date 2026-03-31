import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db.js';
import { getAuthUser, attachAuthCookie, requirePermission } from '../../../lib/auth.js';
import { programService } from '../../../services/program.service.js';

export async function GET(request) {
  try {
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requirePermission(user, 'programs');
    const programs = await programService.list();
    const response = NextResponse.json(programs);
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
    requirePermission(user, 'programs');
    const body = await request.json();
    const program = await programService.create(body);
    const response = NextResponse.json(program, { status: 201 });
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
