import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData } from './types';

const sessionConfig = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'ithub-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/pc') ||
      request.nextUrl.pathname.startsWith('/server') ||
      request.nextUrl.pathname.startsWith('/network') ||
      request.nextUrl.pathname.startsWith('/printer') ||
      request.nextUrl.pathname.startsWith('/software') ||
      request.nextUrl.pathname.startsWith('/reports')) {

    try {
      const session = await getIronSession<SessionData>(request, response, sessionConfig);

      if (!session.isLoggedIn) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (request.nextUrl.pathname === '/login') {
    try {
      const session = await getIronSession<SessionData>(request, response, sessionConfig);

      if (session.isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      // Continue to login page
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pc/:path*',
    '/server/:path*',
    '/network/:path*',
    '/printer/:path*',
    '/software/:path*',
    '/reports/:path*',
    '/login',
  ],
};
