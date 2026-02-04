import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { runQuery, getOne, runUpdate, runDelete } from '@/lib/db';
import { recordHistory } from '@/lib/db/history';
import { compareObjects } from '@/lib/utils/compare';
import { Printer } from '@/types';

// GET - 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const printer = await getOne<Printer>('SELECT * FROM printers WHERE id = ?', [params.id]);

    if (!printer) {
      return NextResponse.json({ error: '프린터를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Get history
    const history = await runQuery(
      `SELECT TOP 50 h.*, u.name as changed_by_name
       FROM asset_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.asset_type = 'printer' AND h.asset_id = ?
       ORDER BY h.changed_at DESC`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: printer,
      history,
    });
  } catch (error) {
    console.error('Printer get error:', error);
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT - 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      asset_number,
      model_name,
      ip_address,
      location,
      toner_status,
      drum_status,
      vendor_name,
      vendor_contact,
      status,
      notes,
    } = body;

    // Get old data for history
    const oldPrinter = await getOne<Printer>('SELECT * FROM printers WHERE id = ?', [params.id]);

    if (!oldPrinter) {
      return NextResponse.json({ error: '프린터를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Check for duplicate asset number (excluding current printer)
    if (asset_number !== oldPrinter.asset_number) {
      const existing = await runQuery(
        'SELECT id FROM printers WHERE asset_number = ? AND id != ?',
        [asset_number, params.id]
      );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: '이미 존재하는 자산번호입니다.' },
          { status: 400 }
        );
      }
    }

    // Update printer
    await runUpdate(
      `UPDATE printers SET
        asset_number = ?,
        model_name = ?,
        ip_address = ?,
        location = ?,
        toner_status = ?,
        drum_status = ?,
        vendor_name = ?,
        vendor_contact = ?,
        status = ?,
        notes = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        asset_number,
        model_name,
        ip_address || null,
        location || null,
        toner_status || null,
        drum_status || null,
        vendor_name || null,
        vendor_contact || null,
        status,
        notes || null,
        session.user.id,
        params.id,
      ]
    );

    // Record history
    const newPrinter = { ...body };
    const changes = compareObjects(oldPrinter, newPrinter);

    if (changes.length > 0) {
      await recordHistory({
        assetType: 'printer',
        assetId: parseInt(params.id),
        action: 'update',
        changes,
        userId: session.user.id,
      });
    }

    return NextResponse.json({
      success: true,
      data: { id: params.id, ...body },
    });
  } catch (error) {
    console.error('Printer update error:', error);
    return NextResponse.json(
      { error: '수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE - 삭제 (폐기 처리)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const printer = await getOne('SELECT * FROM printers WHERE id = ?', [params.id]);

    if (!printer) {
      return NextResponse.json({ error: '프린터를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Update status to disposed instead of deleting
    await runUpdate(
      'UPDATE printers SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['disposed', session.user.id, params.id]
    );

    // Record history
    await recordHistory({
      assetType: 'printer',
      assetId: parseInt(params.id),
      action: 'dispose',
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Printer delete error:', error);
    return NextResponse.json(
      { error: '삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
