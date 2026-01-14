import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { runQuery, getOne, runUpdate, runDelete } from '@/lib/db';
import { recordHistory } from '@/lib/db/history';
import { compareObjects } from '@/lib/utils/compare';
import { Server } from '@/types';

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

    const server = await getOne<Server>('SELECT * FROM servers WHERE id = ?', [params.id]);

    if (!server) {
      return NextResponse.json({ error: '서버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Get history
    const history = await runQuery(
      `SELECT h.*, u.name as changed_by_name
       FROM asset_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.asset_type = 'server' AND h.asset_id = ?
       ORDER BY h.changed_at DESC
       LIMIT 50`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: server,
      history,
    });
  } catch (error) {
    console.error('Server get error:', error);
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

    // Get old data for history
    const oldServer = await getOne<Server>('SELECT * FROM servers WHERE id = ?', [params.id]);

    if (!oldServer) {
      return NextResponse.json({ error: '서버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Check for duplicate asset number (excluding current server)
    if (asset_number !== oldServer.asset_number) {
      const existing = await runQuery(
        'SELECT id FROM servers WHERE asset_number = ? AND id != ?',
        [asset_number, params.id]
      );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: '이미 존재하는 자산번호입니다.' },
          { status: 400 }
        );
      }
    }

    // Update server
    await runUpdate(
      `UPDATE servers SET
        asset_number = ?,
        rack_location = ?,
        hostname = ?,
        os_version = ?,
        ip_address = ?,
        purpose = ?,
        warranty_expiry = ?,
        cpu = ?,
        ram = ?,
        disk = ?,
        status = ?,
        notes = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
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
        status,
        notes || null,
        session.user.id,
        params.id,
      ]
    );

    // Record history
    const newServer = { ...body };
    const changes = compareObjects(oldServer, newServer);

    if (changes.length > 0) {
      await recordHistory({
        assetType: 'server',
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
    console.error('Server update error:', error);
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

    const server = await getOne('SELECT * FROM servers WHERE id = ?', [params.id]);

    if (!server) {
      return NextResponse.json({ error: '서버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Update status to disposed instead of deleting
    await runUpdate(
      'UPDATE servers SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['disposed', session.user.id, params.id]
    );

    // Record history
    await recordHistory({
      assetType: 'server',
      assetId: parseInt(params.id),
      action: 'dispose',
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server delete error:', error);
    return NextResponse.json(
      { error: '삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
