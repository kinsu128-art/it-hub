const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config({ path: '.env.local' });

// DNS 우회: IPv6 주소로 직접 연결
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

async function initDatabase() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Supabase PostgreSQL...');
    const client = await pool.connect();

    console.log('📋 Dropping existing tables if they exist...');
    await client.query(`
      DROP TABLE IF EXISTS asset_history CASCADE;
      DROP TABLE IF EXISTS software CASCADE;
      DROP TABLE IF EXISTS printers CASCADE;
      DROP TABLE IF EXISTS network_ips CASCADE;
      DROP TABLE IF EXISTS servers CASCADE;
      DROP TABLE IF EXISTS pcs CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log('✨ Creating database schema...');

    // Users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'viewer')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // PC/Laptop assets
    await client.query(`
      CREATE TABLE pcs (
        id SERIAL PRIMARY KEY,
        asset_number TEXT UNIQUE NOT NULL,
        user_name TEXT,
        department TEXT,
        model_name TEXT NOT NULL,
        serial_number TEXT UNIQUE,
        purchase_date DATE,
        cpu TEXT,
        ram TEXT,
        disk TEXT,
        status TEXT DEFAULT 'in_stock' CHECK(status IN ('assigned', 'in_stock', 'repair', 'disposed')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id)
      );
    `);

    // Server assets
    await client.query(`
      CREATE TABLE servers (
        id SERIAL PRIMARY KEY,
        asset_number TEXT UNIQUE NOT NULL,
        rack_location TEXT,
        hostname TEXT NOT NULL,
        os_version TEXT,
        ip_address TEXT,
        purpose TEXT,
        warranty_expiry DATE,
        cpu TEXT,
        ram TEXT,
        disk TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'maintenance', 'disposed')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id)
      );
    `);

    // Network IP addresses
    await client.query(`
      CREATE TABLE network_ips (
        id SERIAL PRIMARY KEY,
        ip_address TEXT UNIQUE NOT NULL,
        subnet_mask TEXT NOT NULL,
        gateway TEXT,
        assigned_device TEXT,
        vlan_id INTEGER,
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id)
      );
    `);

    // Printers
    await client.query(`
      CREATE TABLE printers (
        id SERIAL PRIMARY KEY,
        asset_number TEXT UNIQUE NOT NULL,
        model_name TEXT NOT NULL,
        ip_address TEXT,
        location TEXT,
        toner_status TEXT,
        drum_status TEXT,
        vendor_name TEXT,
        vendor_contact TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'repair', 'disposed')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id)
      );
    `);

    // Software licenses
    await client.query(`
      CREATE TABLE software (
        id SERIAL PRIMARY KEY,
        software_name TEXT NOT NULL,
        license_key TEXT,
        purchased_quantity INTEGER NOT NULL,
        allocated_quantity INTEGER DEFAULT 0,
        expiry_date DATE,
        version TEXT,
        vendor_name TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'disposed')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id),
        CONSTRAINT check_allocation CHECK (allocated_quantity <= purchased_quantity)
      );
    `);

    // Asset history
    await client.query(`
      CREATE TABLE asset_history (
        id SERIAL PRIMARY KEY,
        asset_type TEXT NOT NULL CHECK(asset_type IN ('pc', 'server', 'network', 'printer', 'software')),
        asset_id INTEGER NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('create', 'update', 'delete', 'dispose')),
        field_name TEXT,
        old_value TEXT,
        new_value TEXT,
        changed_by INTEGER REFERENCES users(id),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT
      );
    `);

    // Create indexes
    console.log('📑 Creating indexes...');
    await client.query('CREATE INDEX idx_pcs_status ON pcs(status)');
    await client.query('CREATE INDEX idx_pcs_asset_number ON pcs(asset_number)');
    await client.query('CREATE INDEX idx_servers_hostname ON servers(hostname)');
    await client.query('CREATE INDEX idx_network_ips_ip ON network_ips(ip_address)');
    await client.query('CREATE INDEX idx_network_ips_active ON network_ips(is_active)');
    await client.query('CREATE INDEX idx_software_expiry ON software(expiry_date)');
    await client.query('CREATE INDEX idx_history_asset ON asset_history(asset_type, asset_id)');
    await client.query('CREATE INDEX idx_history_date ON asset_history(changed_at)');

    // Create default admin user
    console.log('👤 Creating default admin user...');
    const passwordHash = bcrypt.hashSync('admin123', 10);
    await client.query(
      `INSERT INTO users (username, password_hash, name, email, role)
       VALUES ($1, $2, $3, $4, $5)`,
      ['admin', passwordHash, 'Administrator', 'admin@ithub.local', 'admin']
    );

    client.release();

    console.log('✅ Database initialization complete!');
    console.log('🔐 Default credentials: admin / admin123');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
