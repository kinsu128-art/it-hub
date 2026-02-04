import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData } from '@/types';

export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'ithub-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
