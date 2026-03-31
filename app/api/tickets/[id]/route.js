import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { getAuthUser, attachAuthCookie, requirePermission } from '../../../../lib/auth.js';
import { ticketService } from '../../../../services/ticket.service.js';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requirePermission(user, 'tickets');
    const ticket = await ticketService.getById(id);
    const response = NextResponse.json(ticket);
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
    requirePermission(user, 'tickets');
    const body = await request.json();
    const ticket = await ticketService.update(id, body);
    const response = NextResponse.json(ticket);
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
    requirePermission(user, 'tickets');
    const result = await ticketService.delete(id);
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
