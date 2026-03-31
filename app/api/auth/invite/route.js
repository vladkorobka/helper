import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { getAuthUser, attachAuthCookie, requireRole } from '../../../../lib/auth.js';
import { authService } from '../../../../services/auth.service.js';

export async function POST(request) {
  try {
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requireRole(user, 'superadmin');
    const body = await request.json();
    const result = await authService.createInvite({ ...body, invitedBy: user._id });
    const response = NextResponse.json(result, { status: 201 });
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
