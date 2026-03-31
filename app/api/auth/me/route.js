import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { getAuthUser, attachAuthCookie } from '../../../../lib/auth.js';
import { authService } from '../../../../services/auth.service.js';

export async function GET(request) {
  try {
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    const freshUser = await authService.getMe(user._id);
    const response = NextResponse.json({ user: freshUser });
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
