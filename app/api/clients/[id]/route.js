import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { getAuthUser, attachAuthCookie, requirePermission } from '../../../../lib/auth.js';
import { clientService } from '../../../../services/client.service.js';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requirePermission(user, 'clients');
    const client = await clientService.getById(id);
    const response = NextResponse.json(client);
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requirePermission(user, 'clients');
    const body = await request.json();
    const client = await clientService.update(id, body);
    const response = NextResponse.json(client);
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requirePermission(user, 'clients');
    const result = await clientService.delete(id);
    const response = NextResponse.json(result);
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
