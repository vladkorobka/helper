import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { getAuthUser, attachAuthCookie, requireRole } from '../../../../lib/auth.js';
import { settingsService } from '../../../../services/settings.service.js';

export async function DELETE(request) {
  try {
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requireRole(user, 'superadmin');
    const { field, value } = await request.json();
    const settings = await settingsService.removeType(field, value);
    const response = NextResponse.json(settings);
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
