import { getDb, runInsert, runQuery } from './index';

export interface RecordHistoryParams {
  assetType: 'pc' | 'server' | 'network' | 'printer' | 'software';
  assetId: number;
  action: 'create' | 'update' | 'delete' | 'dispose';
  changes?: { field: string; oldValue: any; newValue: any }[];
  userId: number;
  ipAddress?: string;
  userAgent?: string;
}

export async function recordHistory(params: RecordHistoryParams) {
  const { assetType, assetId, action, changes, userId, ipAddress, userAgent } = params;

  if (action === 'create' || action === 'delete' || action === 'dispose') {
    // Single history record
    await runInsert(
      `INSERT INTO asset_history
       (asset_type, asset_id, action, changed_by, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [assetType, assetId, action, userId, ipAddress || null, userAgent || null]
    );
  } else if (action === 'update' && changes) {
    // Multiple records for each changed field
    const db = await getDb();
    const client = await db.connect();

    try {
      await client.query('BEGIN TRANSACTION');
      for (const change of changes) {
        await client.query(
          `INSERT INTO asset_history
           (asset_type, asset_id, action, field_name, old_value, new_value, changed_by, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            assetType,
            assetId,
            action,
            change.field,
            JSON.stringify(change.oldValue),
            JSON.stringify(change.newValue),
            userId,
            ipAddress || null,
            userAgent || null,
          ]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export async function getAssetHistory(assetType: string, assetId: number, limit = 50) {
  return runQuery(
    `SELECT h.*, u.name as changed_by_name
     FROM asset_history h
     LEFT JOIN users u ON h.changed_by = u.id
     WHERE h.asset_type = ? AND h.asset_id = ?
     ORDER BY h.changed_at DESC
     LIMIT ?`,
    [assetType, assetId, limit]
  );
}
