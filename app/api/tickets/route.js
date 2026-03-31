import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db.js';
import { getAuthUser, attachAuthCookie, requirePermission } from '../../../lib/auth.js';
import { ticketService } from '../../../services/ticket.service.js';

export async function GET(request) {
  try {
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requirePermission(user, 'tickets');
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams);
    const tickets = await ticketService.list(query);
    const response = NextResponse.json(tickets);
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
    requirePermission(user, 'tickets');
    const body = await request.json();
    const ticket = await ticketService.create(body, user._id);
    const response = NextResponse.json(ticket, { status: 201 });
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
