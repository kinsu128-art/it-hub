import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSession();

    return NextResponse.json({
      user: session.user || null,
      isLoggedIn: session.isLoggedIn || false,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null, isLoggedIn: false });
  }
}
