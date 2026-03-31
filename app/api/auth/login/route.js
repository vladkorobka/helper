import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { authService } from '../../../../services/auth.service.js';
import { COOKIE_NAME, tokenCookieOptions } from '../../../../lib/jwt.js';

export async function POST(request) {
  try {
    await connectDB();
    const { login, password } = await request.json();
    const { token, user } = await authService.login(login, password);
    const response = NextResponse.json({ user });
    response.cookies.set(COOKIE_NAME, token, tokenCookieOptions());
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.statusCode || 500 }
    );
  }
}
