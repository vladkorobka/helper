import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { authService } from '../../../../services/auth.service.js';

export async function POST(request) {
  try {
    await connectDB();
    const { email } = await request.json();
    const result = await authService.forgotPassword(email);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.statusCode || 500 }
    );
  }
}
