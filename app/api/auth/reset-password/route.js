import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { authService } from '../../../../services/auth.service.js';

export async function POST(request) {
  try {
    await connectDB();
    const { token, password } = await request.json();
    const result = await authService.resetPassword(token, password);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.statusCode || 500 }
    );
  }
}
