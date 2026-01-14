/**
 * Database Schema Documentation
 *
 * This application now uses Supabase PostgreSQL instead of SQLite.
 * The database schema has been migrated to Supabase.
 *
 * To set up the database:
 * 1. The schema is already created in Supabase (migration: initial_schema)
 * 2. Get your database password from: https://supabase.com/dashboard/project/sapzbrueaipnbbazsvcl/settings/database
 * 3. Update DATABASE_URL in .env.local with your password
 * 4. Run the initialization script to create the default admin user
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
 * For more details, see: https://supabase.com/dashboard/project/sapzbrueaipnbbazsvcl
 */

import { runQuery, runInsert } from './index';
import { hashPassword } from '@/lib/auth/password';

export async function initializeDatabase() {
  try {
    // Check if admin user already exists
    const existingAdmin = await runQuery(
      'SELECT id FROM users WHERE username = $1',
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
       VALUES ($1, $2, $3, $4, $5)`,
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
