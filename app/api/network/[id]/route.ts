import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { runQuery, getOne, runUpdate, runDelete } from '@/lib/db';
import { recordHistory } from '@/lib/db/history';
import { compareObjects } from '@/lib/utils/compare';
import { NetworkIp } from '@/types';
import { isValidIp } from '@/lib/validation/ipValidator';

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

    const ip = await getOne<NetworkIp>('SELECT * FROM network_ips WHERE id = ?', [params.id]);

    if (!ip) {
      return NextResponse.json({ error: 'IP를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Get history
    const history = await runQuery(
      `SELECT TOP 50 h.*, u.name as changed_by_name
       FROM asset_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.asset_type = 'network' AND h.asset_id = ?
       ORDER BY h.changed_at DESC`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: ip,
      history,
    });
  } catch (error) {
    console.error('Network IP get error:', error);
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
      ip_address,
      subnet_mask,
      gateway,
      assigned_device,
      vlan_id,
      is_active,
      notes,
    } = body;

    // Validate IP format
    if (!isValidIp(ip_address)) {
      return NextResponse.json(
        { error: '유효하지 않은 IP 주소 형식입니다.' },
        { status: 400 }
      );
    }

    // Get old data for history
    const oldIp = await getOne<NetworkIp>('SELECT * FROM network_ips WHERE id = ?', [params.id]);

    if (!oldIp) {
      return NextResponse.json({ error: 'IP를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Check for duplicate IP (excluding current IP)
    if (ip_address !== oldIp.ip_address) {
      const existing = await runQuery(
        'SELECT id, assigned_device FROM network_ips WHERE ip_address = ? AND id != ?',
        [ip_address, params.id]
      );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: `이미 사용 중인 IP 주소입니다. (할당: ${existing[0].assigned_device || '미지정'})` },
          { status: 400 }
        );
      }
    }

    // Update IP
    await runUpdate(
      `UPDATE network_ips SET
        ip_address = ?,
        subnet_mask = ?,
        gateway = ?,
        assigned_device = ?,
        vlan_id = ?,
        is_active = ?,
        notes = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        ip_address,
        subnet_mask,
        gateway || null,
        assigned_device || null,
        vlan_id || null,
        is_active !== undefined ? is_active : 1,
        notes || null,
        session.user.id,
        params.id,
      ]
    );

    // Record history
    const newIp = { ...body };
    const changes = compareObjects(oldIp, newIp);

    if (changes.length > 0) {
      await recordHistory({
        assetType: 'network',
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
    console.error('Network IP update error:', error);
    return NextResponse.json(
      { error: '수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE - 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = await getOne('SELECT * FROM network_ips WHERE id = ?', [params.id]);

    if (!ip) {
      return NextResponse.json({ error: 'IP를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Soft delete - set to inactive
    await runUpdate(
      'UPDATE network_ips SET is_active = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [session.user.id, params.id]
    );

    // Record history
    await recordHistory({
      assetType: 'network',
      assetId: parseInt(params.id),
      action: 'delete',
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Network IP delete error:', error);
    return NextResponse.json(
      { error: '삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
