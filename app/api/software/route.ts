import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { runQuery, runInsert } from '@/lib/db';
import { recordHistory } from '@/lib/db/history';
import { Software } from '@/types';

// GET /api/software - 소프트웨어 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let params: any[] = [];

    if (search) {
      whereConditions.push('(software_name LIKE ? OR license_key LIKE ? OR vendor_name LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // 전체 개수 조회
    const countResult = await runQuery(
      `SELECT COUNT(*) as count FROM software ${whereClause}`,
      params
    );
    const total = countResult[0]?.count || 0;

    // 목록 조회 using ROW_NUMBER() for MSSQL compatibility
    const software = await runQuery(
      `WITH PaginatedData AS (
        SELECT *, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS RowNum
        FROM software ${whereClause}
      )
      SELECT * FROM PaginatedData
      WHERE RowNum BETWEEN ? AND ?`,
      [...params, offset + 1, offset + limit]
    );

    return NextResponse.json({
      success: true,
      data: software,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Software list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch software list' },
      { status: 500 }
    );
  }
}

// POST /api/software - 소프트웨어 등록
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Session user:', session.user);
    console.log('Request body:', body);
    const {
      software_name,
      license_key,
      purchased_quantity,
      allocated_quantity = 0,
      expiry_date,
      version,
      vendor_name,
      status = 'active',
      notes,
    } = body;

    // 필수 필드 검증
    if (!software_name || purchased_quantity === undefined) {
      return NextResponse.json(
        { error: '소프트웨어 이름과 구매 수량은 필수입니다.' },
        { status: 400 }
      );
    }

    // 할당 수량이 구매 수량을 초과하는지 검증
    if (allocated_quantity > purchased_quantity) {
      return NextResponse.json(
        { error: '할당 수량은 구매 수량을 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 소프트웨어 등록
    const insertParams = [
      software_name,
      license_key || null,
      purchased_quantity,
      allocated_quantity,
      expiry_date || null,
      version || null,
      vendor_name || null,
      status,
      notes || null,
      session.user.id,
      session.user.id,
    ];
    console.log('Insert params:', insertParams);

    const result = await runInsert(
      `INSERT INTO software (
        software_name, license_key, purchased_quantity, allocated_quantity,
        expiry_date, version, vendor_name, status, notes,
        created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      insertParams
    );

    // 이력 기록
    await recordHistory({
      assetType: 'software',
      assetId: result.lastID,
      action: 'create',
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      id: result.lastID,
      message: '소프트웨어가 등록되었습니다.',
    });
  } catch (error) {
    console.error('Software create error:', error);
    return NextResponse.json(
      { error: 'Failed to create software' },
      { status: 500 }
    );
  }
}
