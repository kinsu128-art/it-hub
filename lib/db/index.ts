import sql from 'mssql';

// MSSQL Connection Configuration
const config: sql.config = {
  server: process.env.DB_SERVER || '192.168.1.11',
  port: parseInt(process.env.DB_PORT || '2433'),
  database: process.env.DB_DATABASE || 'dk_it',
  user: process.env.DB_USER || 'dkenterb',
  password: process.env.DB_PASSWORD || 'Micro@4580',
  options: {
    encrypt: false, // Use false for local network
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Validate configuration
if (!config.server || !config.database || !config.user || !config.password) {
  console.warn(
    '\n⚠️  Database configuration is incomplete!\n' +
    'Please ensure all DB_* environment variables are set in .env.local\n' +
    'Required: DB_SERVER, DB_PORT, DB_DATABASE, DB_USER, DB_PASSWORD\n'
  );
}

// Create a connection pool
let pool: sql.ConnectionPool | null = null;

async function getDb(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to MSSQL Server');
  }
  return pool;
}

// Helper function to convert ? placeholders to MSSQL @param syntax
function convertPlaceholders(sqlQuery: string, params: any[]): { query: string; params: any[] } {
  let paramIndex = 1;
  const convertedQuery = sqlQuery.replace(/\?/g, () => `@param${paramIndex++}`);
  return { query: convertedQuery, params };
}

// Helper functions
export async function runQuery<T = any>(sqlQuery: string, params: any[] = []): Promise<T[]> {
  try {
    const pool = await getDb();
    const { query, params: convertedParams } = convertPlaceholders(sqlQuery, params);

    const request = pool.request();

    // Add parameters to request
    convertedParams.forEach((param, index) => {
      request.input(`param${index + 1}`, param);
    });

    const result = await request.query(query);
    return result.recordset as T[];
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
  try {
    const pool = await getDb();

    // Remove RETURNING clause if exists (PostgreSQL-specific)
    let cleanedSql = sqlQuery.replace(/RETURNING\s+\w+/gi, '').trim();

    // Add OUTPUT INSERTED.id for MSSQL to get the last inserted ID
    // Correct MSSQL syntax: INSERT INTO table (cols) OUTPUT INSERTED.id VALUES (...)
    if (!cleanedSql.toUpperCase().includes('OUTPUT')) {
      // Match: INSERT INTO table_name (column_list) VALUES
      cleanedSql = cleanedSql.replace(
        /INSERT\s+INTO\s+(\w+)\s*\(([\s\S]*?)\)\s*VALUES/i,
        'INSERT INTO $1 ($2) OUTPUT INSERTED.id VALUES'
      );
    }

    const { query, params: convertedParams } = convertPlaceholders(cleanedSql, params);

    // Debug logging
    console.log('🔍 SQL Query:', query);
    console.log('🔍 Params:', convertedParams);

    const request = pool.request();

    // Add parameters
    convertedParams.forEach((param, index) => {
      request.input(`param${index + 1}`, param);
    });

    const result = await request.query(query);
    const lastId = result.recordset && result.recordset[0] ? result.recordset[0].id : 0;

    return { lastID: lastId, lastInsertRowid: lastId };
  } catch (error) {
    console.error('Insert error:', error);
    console.error('Original SQL:', sqlQuery);
    console.error('Params:', params);
    throw error;
  }
}

export async function runUpdate(sqlQuery: string, params: any[] = []): Promise<{ changes: number }> {
  try {
    const pool = await getDb();
    const { query, params: convertedParams } = convertPlaceholders(sqlQuery, params);

    const request = pool.request();

    // Add parameters
    convertedParams.forEach((param, index) => {
      request.input(`param${index + 1}`, param);
    });

    const result = await request.query(query);
    return { changes: result.rowsAffected[0] || 0 };
  } catch (error) {
    console.error('Update error:', error);
    console.error('SQL:', sqlQuery);
    console.error('Params:', params);
    throw error;
  }
}

export async function runDelete(sqlQuery: string, params: any[] = []): Promise<{ changes: number }> {
  try {
    const pool = await getDb();
    const { query, params: convertedParams } = convertPlaceholders(sqlQuery, params);

    const request = pool.request();

    // Add parameters
    convertedParams.forEach((param, index) => {
      request.input(`param${index + 1}`, param);
    });

    const result = await request.query(query);
    return { changes: result.rowsAffected[0] || 0 };
  } catch (error) {
    console.error('Delete error:', error);
    console.error('SQL:', sqlQuery);
    console.error('Params:', params);
    throw error;
  }
}

export async function transaction<T>(callback: (transaction: sql.Transaction) => Promise<T>): Promise<T> {
  const pool = await getDb();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    console.error('Transaction error:', error);
    throw error;
  }
}

export { getDb };
export default { getDb, runQuery, getOne, runInsert, runUpdate, runDelete, transaction };
