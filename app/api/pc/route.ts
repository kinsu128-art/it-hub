import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { runQuery, runInsert } from '@/lib/db';
import { recordHistory } from '@/lib/db/history';
import { Pc } from '@/types';

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
    const department = searchParams.get('department') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (asset_number LIKE ? OR model_name LIKE ? OR user_name LIKE ? OR serial_number LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (department) {
      whereClause += ' AND department = ?';
      params.push(department);
    }

    // Get total count
    const countResult = await runQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM pcs ${whereClause}`,
      params
    );
    const total = countResult[0]?.count || 0;

    // Get paginated data
    const pcs = await runQuery<Pc>(
      `SELECT * FROM pcs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: pcs,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('PC list error:', error);
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
      user_name,
      department,
      model_name,
      serial_number,
      purchase_date,
      cpu,
      ram,
      disk,
      status,
      notes,
    } = body;

    // Validate required fields
    if (!asset_number || !model_name) {
      return NextResponse.json(
        { error: '자산번호와 모델명은 필수입니다.' },
        { status: 400 }
      );
    }

    // Check for duplicate asset number
    const existing = await runQuery(
      'SELECT id FROM pcs WHERE asset_number = ?',
      [asset_number]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: '이미 존재하는 자산번호입니다.' },
        { status: 400 }
      );
    }

    // Insert PC (created_at and updated_at are auto-generated)
    const result = await runInsert(
      `INSERT INTO pcs (
        asset_number, user_name, department, model_name, serial_number,
        purchase_date, cpu, ram, disk, status, notes, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset_number,
        user_name || null,
        department || null,
        model_name,
        serial_number || null,
        purchase_date || null,
        cpu || null,
        ram || null,
        disk || null,
        status || 'in_stock',
        notes || null,
        session.user.id,
        session.user.id,
      ]
    );

    // Record history
    await recordHistory({
      assetType: 'pc',
      assetId: result.lastInsertRowid,
      action: 'create',
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: { id: result.lastInsertRowid, ...body },
    });
  } catch (error) {
    console.error('PC create error:', error);
    return NextResponse.json(
      { error: '등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
