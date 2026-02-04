import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { runQuery, runUpdate, getOne } from '@/lib/db';
import { recordHistory } from '@/lib/db/history';
import { compareObjects } from '@/lib/utils/compare';
import { Software } from '@/types';

// GET /api/software/[id] - 소프트웨어 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const software = await getOne(
      'SELECT * FROM software WHERE id = ?',
      [params.id]
    );

    if (!software) {
      return NextResponse.json({ error: 'Software not found' }, { status: 404 });
    }

    // 변경 이력 조회
    const history = await runQuery(
      `SELECT TOP 50 h.*, u.name as changed_by_name
       FROM asset_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.asset_type = 'software' AND h.asset_id = ?
       ORDER BY h.changed_at DESC`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: software,
      history,
    });
  } catch (error) {
    console.error('Software detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch software details' },
      { status: 500 }
    );
  }
}

// PUT /api/software/[id] - 소프트웨어 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      software_name,
      license_key,
      purchased_quantity,
      allocated_quantity,
      expiry_date,
      version,
      vendor_name,
      status,
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

    // 기존 데이터 조회
    const oldSoftware = await getOne(
      'SELECT * FROM software WHERE id = ?',
      [params.id]
    );

    if (!oldSoftware) {
      return NextResponse.json({ error: 'Software not found' }, { status: 404 });
    }

    // 소프트웨어 수정
    await runUpdate(
      `UPDATE software SET
        software_name = ?,
        license_key = ?,
        purchased_quantity = ?,
        allocated_quantity = ?,
        expiry_date = ?,
        version = ?,
        vendor_name = ?,
        status = ?,
        notes = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
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
        params.id,
      ]
    );

    // 변경 사항 비교 및 이력 기록
    const newSoftware = { ...body };
    const changes = compareObjects(oldSoftware, newSoftware);

    if (changes.length > 0) {
      await recordHistory({
        assetType: 'software',
        assetId: parseInt(params.id),
        action: 'update',
        changes,
        userId: session.user.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: '소프트웨어가 수정되었습니다.',
    });
  } catch (error) {
    console.error('Software update error:', error);
    return NextResponse.json(
      { error: 'Failed to update software' },
      { status: 500 }
    );
  }
}

// DELETE /api/software/[id] - 소프트웨어 삭제 (폐기 처리)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 소프트웨어 상태를 'disposed'로 변경
    await runUpdate(
      `UPDATE software SET
        status = 'disposed',
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [session.user.id, params.id]
    );

    // 이력 기록
    await recordHistory({
      assetType: 'software',
      assetId: parseInt(params.id),
      action: 'dispose',
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: '소프트웨어가 폐기 처리되었습니다.',
    });
  } catch (error) {
    console.error('Software delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete software' },
      { status: 500 }
    );
  }
}
