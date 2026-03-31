import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db.js';
import { getAuthUser, attachAuthCookie, requirePermission } from '../../../lib/auth.js';
import { clientService } from '../../../services/client.service.js';

export async function GET(request) {
  try {
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requirePermission(user, 'clients');
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const clients = await clientService.list(search);
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

export async function POST(request) {
  try {
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requirePermission(user, 'clients');
    const body = await request.json();
    const client = await clientService.create(body);
    const response = NextResponse.json(client, { status: 201 });
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
