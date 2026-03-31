import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { getAuthUser, attachAuthCookie } from '../../../../lib/auth.js';
import { clientService } from '../../../../services/client.service.js';

export async function GET(request) {
  try {
    await connectDB();
    const { newToken } = await getAuthUser(request);
    const clients = await clientService.forDropdown();
    const response = NextResponse.json(clients);
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
