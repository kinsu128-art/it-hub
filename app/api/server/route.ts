import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { runQuery, runInsert } from '@/lib/db';
import { recordHistory } from '@/lib/db/history';
import { Server } from '@/types';

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
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (asset_number LIKE ? OR hostname LIKE ? OR ip_address LIKE ? OR purpose LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = await runQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM servers ${whereClause}`,
      params
    );
    const total = countResult[0]?.count || 0;

    // Get paginated data
    const servers = await runQuery<Server>(
      `SELECT * FROM servers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: servers,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Server list error:', error);
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
      asset_number,
      rack_location,
      hostname,
      os_version,
      ip_address,
      purpose,
      warranty_expiry,
      cpu,
      ram,
      disk,
      status,
      notes,
    } = body;

    // Validate required fields
    if (!asset_number || !hostname) {
      return NextResponse.json(
        { error: '자산번호와 호스트명은 필수입니다.' },
        { status: 400 }
      );
    }

    // Check for duplicate asset number
    const existing = await runQuery(
      'SELECT id FROM servers WHERE asset_number = ?',
      [asset_number]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: '이미 존재하는 자산번호입니다.' },
        { status: 400 }
      );
    }

    // Insert server
    const result = await runInsert(
      `INSERT INTO servers (
        asset_number, rack_location, hostname, os_version, ip_address,
        purpose, warranty_expiry, cpu, ram, disk, status, notes, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset_number,
        rack_location || null,
        hostname,
        os_version || null,
        ip_address || null,
        purpose || null,
        warranty_expiry || null,
        cpu || null,
        ram || null,
        disk || null,
        status || 'active',
        notes || null,
        session.user.id,
        session.user.id,
      ]
    );

    // Record history
    await recordHistory({
      assetType: 'server',
      assetId: result.lastInsertRowid,
      action: 'create',
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: { id: result.lastInsertRowid, ...body },
    });
  } catch (error) {
    console.error('Server create error:', error);
    return NextResponse.json(
      { error: '등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
