/**
 * Database Schema Documentation
 *
 * This application uses MSSQL (Microsoft SQL Server) for data persistence.
 * The database server is hosted externally at 192.168.1.11:2433
 *
 * To set up the database:
 * 1. Ensure MSSQL server is accessible at 192.168.1.11:2433
 * 2. Database name: dk_it
 * 3. The schema should be created using scripts/init-db-mssql.sql
 * 4. Update DB_* environment variables in .env.local
 *
 * Database Tables:
 * - users: User accounts with roles (admin/user/viewer)
 * - pcs: PC/Laptop assets
 * - servers: Server assets
 * - network_ips: IP address management
 * - printers: Printer assets
 * - software: Software licenses
 * - asset_history: Audit log for all asset changes
 *
 * For more details, see: scripts/init-db-mssql.sql
 */

import { runQuery, runInsert } from './index';
import { hashPassword } from '@/lib/auth/password';

export async function initializeDatabase() {
  try {
    // Check if admin user already exists
    const existingAdmin = await runQuery(
      'SELECT id FROM users WHERE username = ?',
      [process.env.ADMIN_USERNAME || 'admin']
    );

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Create default admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await hashPassword(adminPassword);

    await runInsert(
      `INSERT INTO users (username, password_hash, name, email, role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        process.env.ADMIN_USERNAME || 'admin',
        hashedPassword,
        'Administrator',
        'admin@example.com',
        'admin',
      ]
    );

    console.log('Database initialized successfully');
    console.log('Default admin user created');
    console.log(`Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
    console.log(`Password: ${adminPassword}`);
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}
