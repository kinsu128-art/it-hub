import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { runQuery } from '@/lib/db';

// GET - 보고서 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'week'; // week, month
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE changed_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (period === 'week') {
      dateFilter = "WHERE changed_at >= datetime('now', '-7 days')";
    } else if (period === 'month') {
      dateFilter = "WHERE changed_at >= datetime('now', '-30 days')";
    }

    // Get asset counts by type
    const pcCount = await runQuery<{ total: number; active: number }>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('assigned', 'in_stock') THEN 1 ELSE 0 END) as active
       FROM pcs`
    );

    const serverCount = await runQuery<{ total: number; active: number }>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
       FROM servers`
    );

    const printerCount = await runQuery<{ total: number; active: number }>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
       FROM printers`
    );

    const networkCount = await runQuery<{ total: number; active: number }>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
       FROM network_ips`
    );

    const softwareCount = await runQuery<{ total: number; active: number }>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
       FROM software`
    );

    // Get PC status distribution
    const pcByStatus = await runQuery<{ status: string; count: number }>(
      'SELECT status, COUNT(*) as count FROM pcs GROUP BY status'
    );

    // Get Server status distribution
    const serverByStatus = await runQuery<{ status: string; count: number }>(
      'SELECT status, COUNT(*) as count FROM servers GROUP BY status'
    );

    // Get Printer status distribution
    const printerByStatus = await runQuery<{ status: string; count: number }>(
      'SELECT status, COUNT(*) as count FROM printers GROUP BY status'
    );

    // Get change history for the period
    const changeHistory = await runQuery(
      `SELECT
        h.*,
        u.name as changed_by_name
       FROM asset_history h
       LEFT JOIN users u ON h.changed_by = u.id
       ${dateFilter}
       ORDER BY h.changed_at DESC
       LIMIT 100`,
      params
    );

    // Get changes by action type
    const changesByAction = await runQuery<{ action: string; count: number }>(
      `SELECT action, COUNT(*) as count
       FROM asset_history
       ${dateFilter}
       GROUP BY action`,
      params
    );

    // Get changes by asset type
    const changesByAssetType = await runQuery<{ asset_type: string; count: number }>(
      `SELECT asset_type, COUNT(*) as count
       FROM asset_history
       ${dateFilter}
       GROUP BY asset_type`,
      params
    );

    // Get daily change counts (for charts)
    const dailyChanges = await runQuery<{ date: string; count: number }>(
      `SELECT
        DATE(changed_at) as date,
        COUNT(*) as count
       FROM asset_history
       ${dateFilter}
       GROUP BY DATE(changed_at)
       ORDER BY date ASC`,
      params
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          pc: pcCount[0] || { total: 0, active: 0 },
          server: serverCount[0] || { total: 0, active: 0 },
          printer: printerCount[0] || { total: 0, active: 0 },
          network: networkCount[0] || { total: 0, active: 0 },
          software: softwareCount[0] || { total: 0, active: 0 },
        },
        statusDistribution: {
          pc: pcByStatus,
          server: serverByStatus,
          printer: printerByStatus,
        },
        changes: {
          history: changeHistory,
          byAction: changesByAction,
          byAssetType: changesByAssetType,
          daily: dailyChanges,
        },
        period: {
          type: period,
          startDate: startDate || (period === 'week' ? 'Last 7 days' : 'Last 30 days'),
          endDate: endDate || 'Now',
        },
      },
    });
  } catch (error) {
    console.error('Report error:', error);
    // Return success with empty data on error to allow dashboard to load
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          pc: { total: 0, active: 0 },
          server: { total: 0, active: 0 },
          printer: { total: 0, active: 0 },
          network: { total: 0, active: 0 },
          software: { total: 0, active: 0 },
        },
        statusDistribution: {
          pc: [],
          server: [],
          printer: [],
        },
        changes: {
          history: [],
          byAction: [],
          byAssetType: [],
          daily: [],
        },
        period: {
          type: 'week',
          startDate: 'Last 7 days',
          endDate: 'Now',
        },
      },
    });
  }
}
