import { NextResponse } from 'next/server';
import { verifyTokenEdge } from './lib/jwt-edge.js';
import { COOKIE_NAME } from './lib/jwt.js';

// Paths accessible without authentication
const PUBLIC_PATHS = [
  '/login',
  '/accept-invite',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/invite/',     // GET invite info by token (dynamic)
  '/api/auth/accept-invite',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths, static assets, and Next.js internals
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Nie zalogowany' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await verifyTokenEdge(token);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { message: 'Sesja wygasła, zaloguj się ponownie' },
        { status: 401 }
      );
    }
    // Clear expired cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
