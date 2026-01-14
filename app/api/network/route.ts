import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { runQuery, runInsert } from '@/lib/db';
import { recordHistory } from '@/lib/db/history';
import { NetworkIp } from '@/types';
import { isValidIp } from '@/lib/validation/ipValidator';

// GET - 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('is_active') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (ip_address LIKE ? OR assigned_device LIKE ? OR gateway LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (isActive !== '') {
      whereClause += ' AND is_active = ?';
      params.push(isActive === '1' ? 1 : 0);
    }

    // Get total count
    const countResult = await runQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM network_ips ${whereClause}`,
      params
    );
    const total = countResult[0]?.count || 0;

    // Get paginated data
    const ips = await runQuery<NetworkIp>(
      `SELECT * FROM network_ips ${whereClause} ORDER BY ip_address LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: ips,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Network IP list error:', error);
    return NextResponse.json(
      { error: '목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST - 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      ip_address,
      subnet_mask,
      gateway,
      assigned_device,
      vlan_id,
      is_active,
      notes,
    } = body;

    // Validate required fields
    if (!ip_address || !subnet_mask) {
      return NextResponse.json(
        { error: 'IP 주소와 서브넷 마스크는 필수입니다.' },
        { status: 400 }
      );
    }

    // Validate IP format
    if (!isValidIp(ip_address)) {
      return NextResponse.json(
        { error: '유효하지 않은 IP 주소 형식입니다.' },
        { status: 400 }
      );
    }

    // Check for duplicate IP
    const existing = await runQuery(
      'SELECT id, assigned_device FROM network_ips WHERE ip_address = ?',
      [ip_address]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `이미 사용 중인 IP 주소입니다. (할당: ${existing[0].assigned_device || '미지정'})` },
        { status: 400 }
      );
    }

    // Insert IP
    const result = await runInsert(
      `INSERT INTO network_ips (
        ip_address, subnet_mask, gateway, assigned_device, vlan_id, is_active, notes, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ip_address,
        subnet_mask,
        gateway || null,
        assigned_device || null,
        vlan_id || null,
        is_active !== undefined ? is_active : 1,
        notes || null,
        session.user.id,
        session.user.id,
      ]
    );

    // Record history
    await recordHistory({
      assetType: 'network',
      assetId: result.lastInsertRowid,
      action: 'create',
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: { id: result.lastInsertRowid, ...body },
    });
  } catch (error) {
    console.error('Network IP create error:', error);
    return NextResponse.json(
      { error: '등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
