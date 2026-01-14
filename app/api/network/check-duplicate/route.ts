import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { runQuery } from '@/lib/db';

// POST - IP 중복 체크
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ip_address, excludeId } = await request.json();

    if (!ip_address) {
      return NextResponse.json(
        { error: 'IP 주소가 필요합니다.' },
        { status: 400 }
      );
    }

    const existing = await runQuery(
      `SELECT id, assigned_device, is_active FROM network_ips
       WHERE ip_address = ? AND id != ? AND is_active = 1`,
      [ip_address, excludeId || 0]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        isDuplicate: true,
        existingDevice: existing[0].assigned_device || '미지정',
      });
    }

    return NextResponse.json({ isDuplicate: false });
  } catch (error) {
    console.error('IP duplicate check error:', error);
    return NextResponse.json(
      { error: '중복 체크 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
