import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { authService } from '../../../../services/auth.service.js';
import { COOKIE_NAME, tokenCookieOptions } from '../../../../lib/jwt.js';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { token, user } = await authService.acceptInvite(body);
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(COOKIE_NAME, token, tokenCookieOptions());
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.statusCode || 500 }
    );
  }
}
