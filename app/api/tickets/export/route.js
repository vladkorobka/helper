import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { getAuthUser, attachAuthCookie, requirePermission } from '../../../../lib/auth.js';
import { ticketService } from '../../../../services/ticket.service.js';

export async function GET(request) {
  try {
    await connectDB();
    const { user, newToken } = await getAuthUser(request);
    requirePermission(user, 'tickets');
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // MM-YYYY
    if (!date || !/^\d{2}-\d{4}$/.test(date)) {
      return NextResponse.json({ message: 'Nieprawidłowy parametr date (oczekiwany: MM-YYYY)' }, { status: 400 });
    }
    const [mm, yyyy] = date.split('-');
    const csv = await ticketService.exportCsv(date);
    const filename = `raport ${yyyy}-${mm}.csv`;
    const response = new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
