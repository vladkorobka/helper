import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { getAuthUser, attachAuthCookie } from '../../../../lib/auth.js';
import { programService } from '../../../../services/program.service.js';

export async function GET(request) {
  try {
    await connectDB();
    const { newToken } = await getAuthUser(request);
    const programs = await programService.forDropdown();
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
