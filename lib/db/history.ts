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
    // Multiple records for each changed field - use transaction
    const { transaction, getDb } = await import('./index');

    await transaction(async (tx) => {
      for (const change of changes) {
        const request = tx.request();
        request.input('assetType', assetType);
        request.input('assetId', assetId);
        request.input('action', action);
        request.input('fieldName', change.field);
        request.input('oldValue', JSON.stringify(change.oldValue));
        request.input('newValue', JSON.stringify(change.newValue));
        request.input('userId', userId);
        request.input('ipAddress', ipAddress || null);
        request.input('userAgent', userAgent || null);

        await request.query(
          `INSERT INTO asset_history
           (asset_type, asset_id, action, field_name, old_value, new_value, changed_by, ip_address, user_agent)
           VALUES (@assetType, @assetId, @action, @fieldName, @oldValue, @newValue, @userId, @ipAddress, @userAgent)`
        );
      }
    });
  }
}

export async function getAssetHistory(assetType: string, assetId: number, limit = 50) {
  return runQuery(
    `SELECT TOP ${limit} h.*, u.name as changed_by_name
     FROM asset_history h
     LEFT JOIN users u ON h.changed_by = u.id
     WHERE h.asset_type = ? AND h.asset_id = ?
     ORDER BY h.changed_at DESC`,
    [assetType, assetId]
  );
}
