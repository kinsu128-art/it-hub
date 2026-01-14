import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { verifyPassword } from '@/lib/auth/password';
import { getOne } from '@/lib/db';
import { User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    console.log('Login attempt for username:', username);

    if (!username || !password) {
      return NextResponse.json(
        { error: '사용자명과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Get user from database
    let user;
    try {
      user = await getOne<User & { password_hash: string }>(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      console.log('User found:', user ? 'Yes' : 'No');
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { error: '데이터베이스 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: '사용자명 또는 비밀번호가 잘못되었습니다.' },
        { status: 401 }
      );
    }

    // Verify password
    let isValid;
    try {
      isValid = await verifyPassword(password, user.password_hash);
      console.log('Password valid:', isValid);
    } catch (passwordError) {
      console.error('Password verification error:', passwordError);
      return NextResponse.json(
        { error: '비밀번호 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { error: '사용자명 또는 비밀번호가 잘못되었습니다.' },
        { status: 401 }
      );
    }

    // Create session
    try {
      const session = await getSession();
      session.user = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      };
      session.isLoggedIn = true;
      await session.save();

      console.log('Login successful for user:', username);

      return NextResponse.json({
        success: true,
        user: session.user,
      });
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        { error: '세션 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
