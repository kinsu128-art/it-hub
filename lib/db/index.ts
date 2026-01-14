import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
  console.warn(
    '\n⚠️  DATABASE_URL is not configured!\n' +
    'Please update .env.local with your Supabase database password.\n' +
    'Get it from: https://supabase.com/dashboard/project/sapzbrueaipnbbazsvcl/settings/database\n'
  );
}

// Create a connection pool
let pool: Pool | null = null;

function getDb(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

// Helper functions
export async function runQuery<T = any>(sqlQuery: string, params: any[] = []): Promise<T[]> {
  const client = getDb();

  try {
    // Convert ? placeholders to $1, $2, etc. for postgres
    let paramIndex = 1;
    const convertedSql = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);

    const result = await client.query(convertedSql, params);
    return result.rows as T[];
  } catch (error) {
    console.error('Query error:', error);
    console.error('SQL:', sqlQuery);
    console.error('Params:', params);
    throw error;
  }
}

export async function getOne<T = any>(sqlQuery: string, params: any[] = []): Promise<T | null> {
  const results = await runQuery<T>(sqlQuery, params);
  return results[0] || null;
}

export async function runInsert(sqlQuery: string, params: any[] = []): Promise<{ lastID: number; lastInsertRowid: number }> {
  const client = getDb();

  try {
    // Add RETURNING id to get the inserted ID
    let modifiedSql = sqlQuery.trim();
    if (!modifiedSql.toLowerCase().includes('returning')) {
      modifiedSql += ' RETURNING id';
    }

    // Convert ? placeholders to $1, $2, etc.
    let paramIndex = 1;
    const convertedSql = modifiedSql.replace(/\?/g, () => `$${paramIndex++}`);

    const result = await client.query(convertedSql, params);
    const lastId = result.rows[0]?.id || 0;

    return { lastID: lastId, lastInsertRowid: lastId };
  } catch (error) {
    console.error('Insert error:', error);
    console.error('SQL:', sqlQuery);
    console.error('Params:', params);
    throw error;
  }
}

export async function runUpdate(sqlQuery: string, params: any[] = []): Promise<{ changes: number }> {
  const client = getDb();

  try {
    // Convert ? placeholders to $1, $2, etc.
    let paramIndex = 1;
    const convertedSql = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);

    const result = await client.query(convertedSql, params);
    return { changes: result.rowCount || 0 };
  } catch (error) {
    console.error('Update error:', error);
    console.error('SQL:', sqlQuery);
    console.error('Params:', params);
    throw error;
  }
}

export async function runDelete(sqlQuery: string, params: any[] = []): Promise<{ changes: number }> {
  const client = getDb();

  try {
    // Convert ? placeholders to $1, $2, etc.
    let paramIndex = 1;
    const convertedSql = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);

    const result = await client.query(convertedSql, params);
    return { changes: result.rowCount || 0 };
  } catch (error) {
    console.error('Delete error:', error);
    console.error('SQL:', sqlQuery);
    console.error('Params:', params);
    throw error;
  }
}

export async function transaction<T>(callback: () => Promise<T>): Promise<T> {
  const client = await getDb().connect();

  try {
    await client.query('BEGIN');
    const result = await callback();
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export { getDb };
export default { getDb, runQuery, getOne, runInsert, runUpdate, runDelete, transaction };
