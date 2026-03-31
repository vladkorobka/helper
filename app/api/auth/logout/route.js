import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '../../../../lib/jwt.js';

export async function POST() {
  const response = NextResponse.json({ message: 'Wylogowano pomyślnie' });
  response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return response;
}
