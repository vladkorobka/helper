import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db.js';
import { authService } from '../../../../../services/auth.service.js';

export async function GET(_request, { params }) {
  try {
    const { token } = await params;
    await connectDB();
    const info = await authService.getInviteInfo(token);
    return NextResponse.json(info);
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.statusCode || 500 }
    );
  }
}
