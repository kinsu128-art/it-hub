import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
  console.warn(
    '\n⚠️  DATABASE_URL is not configured!\n' +
    'Please update .env.local with your Supabase database password.\n' +
    'Get it from: https://supabase.com/dashboard/project/sapzbrueaipnbbazsvcl/settings/database\n'
  );
}

// Create a postgres connection
let sql: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (!sql) {
    sql = postgres(connectionString, {
      max: 10, // Connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return sql;
}

// Helper functions
export async function runQuery<T = any>(sqlQuery: string, params: any[] = []): Promise<T[]> {
  const db = getDb();

  try {
    // Convert ? placeholders to $1, $2, etc. for postgres
    let paramIndex = 1;
    const convertedSql = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);

    const results = await db.unsafe(convertedSql, params);
    return results as T[];
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
  const db = getDb();

  try {
    // Add RETURNING id to get the inserted ID
    let modifiedSql = sqlQuery.trim();
    if (!modifiedSql.toLowerCase().includes('returning')) {
      modifiedSql += ' RETURNING id';
    }

    // Convert ? placeholders to $1, $2, etc.
    let paramIndex = 1;
    const convertedSql = modifiedSql.replace(/\?/g, () => `$${paramIndex++}`);

    const results = await db.unsafe(convertedSql, params);
    const lastId = results[0]?.id || 0;

    return { lastID: lastId, lastInsertRowid: lastId };
  } catch (error) {
    console.error('Insert error:', error);
    console.error('SQL:', sqlQuery);
    console.error('Params:', params);
    throw error;
  }
}

export async function runUpdate(sqlQuery: string, params: any[] = []): Promise<{ changes: number }> {
  const db = getDb();

  try {
    // Convert ? placeholders to $1, $2, etc.
    let paramIndex = 1;
    const convertedSql = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);

    const results = await db.unsafe(convertedSql, params);
    return { changes: Array.isArray(results) ? results.length : 1 };
  } catch (error) {
    console.error('Update error:', error);
    console.error('SQL:', sqlQuery);
    console.error('Params:', params);
    throw error;
  }
}

export async function runDelete(sqlQuery: string, params: any[] = []): Promise<{ changes: number }> {
  const db = getDb();

  try {
    // Convert ? placeholders to $1, $2, etc.
    let paramIndex = 1;
    const convertedSql = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);

    const results = await db.unsafe(convertedSql, params);
    return { changes: Array.isArray(results) ? results.length : 1 };
  } catch (error) {
    console.error('Delete error:', error);
    console.error('SQL:', sqlQuery);
    console.error('Params:', params);
    throw error;
  }
}

export async function transaction<T>(callback: () => Promise<T>): Promise<T> {
  const db = getDb();

  try {
    return await db.begin(async (tx) => {
      // Temporarily replace the global connection with the transaction
      const originalSql = sql;
      sql = tx as any;

      try {
        const result = await callback();
        return result;
      } finally {
        sql = originalSql;
      }
    });
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
}

export default { getDb, runQuery, getOne, runInsert, runUpdate, runDelete, transaction };
