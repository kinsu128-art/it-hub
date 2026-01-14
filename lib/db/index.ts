import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './database/ithub.db';
const dbDir = path.dirname(dbPath);

let db: SqlJsDatabase | null = null;
let SQL: any = null;

async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;

  // Ensure database directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Initialize SQL.js - use local wasm file from node_modules
  if (!SQL) {
    const wasmBinary = fs.readFileSync(
      path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm')
    );

    SQL = await initSqlJs({
      wasmBinary: wasmBinary.buffer.slice(
        wasmBinary.byteOffset,
        wasmBinary.byteOffset + wasmBinary.byteLength
      ) as ArrayBuffer,
    });
  }

  // Load existing database or create new one
  let database: SqlJsDatabase;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    database = new SQL.Database(buffer);
  } else {
    database = new SQL.Database();
  }

  // Enable foreign keys
  database.run('PRAGMA foreign_keys = ON');

  db = database;
  return database;
}

async function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

export async function getDb(): Promise<SqlJsDatabase> {
  if (!db) {
    db = await initDatabase();
  }
  return db;
}

// Helper functions
export async function runQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await getDb();

  try {
    const stmt = database.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }

    const results: T[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row as T);
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

export async function getOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const results = await runQuery<T>(sql, params);
  return results[0] || null;
}

export async function runInsert(sql: string, params: any[] = []): Promise<{ lastID: number; lastInsertRowid: number }> {
  const database = await getDb();

  try {
    database.run(sql, params);
    await saveDatabase();

    const result = database.exec('SELECT last_insert_rowid() as id');
    const lastId = result[0]?.values[0]?.[0] as number || 0;

    return { lastID: lastId, lastInsertRowid: lastId };
  } catch (error) {
    console.error('Insert error:', error);
    throw error;
  }
}

export async function runUpdate(sql: string, params: any[] = []): Promise<{ changes: number }> {
  const database = await getDb();

  try {
    database.run(sql, params);
    await saveDatabase();

    return { changes: 1 };
  } catch (error) {
    console.error('Update error:', error);
    throw error;
  }
}

export async function runDelete(sql: string, params: any[] = []): Promise<{ changes: number }> {
  const database = await getDb();

  try {
    database.run(sql, params);
    await saveDatabase();

    return { changes: 1 };
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

export async function transaction<T>(callback: () => Promise<T>): Promise<T> {
  const database = await getDb();
  database.run('BEGIN TRANSACTION');

  try {
    const result = await callback();
    database.run('COMMIT');
    await saveDatabase();
    return result;
  } catch (error) {
    database.run('ROLLBACK');
    throw error;
  }
}

export default { getDb, runQuery, getOne, runInsert, runUpdate, runDelete, transaction };
