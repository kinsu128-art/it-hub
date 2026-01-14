import { getDb } from './index';

export async function initializeDatabase() {
  const db = await getDb();

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'viewer')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // PC/Laptop assets
  db.run(`
    CREATE TABLE IF NOT EXISTS pcs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      updated_by INTEGER REFERENCES users(id)
    );
  `);

  // Server assets
  db.run(`
    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      updated_by INTEGER REFERENCES users(id)
    );
  `);

  // Network IP addresses
  db.run(`
    CREATE TABLE IF NOT EXISTS network_ips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT UNIQUE NOT NULL,
      subnet_mask TEXT NOT NULL,
      gateway TEXT,
      assigned_device TEXT,
      vlan_id INTEGER,
      is_active BOOLEAN DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      updated_by INTEGER REFERENCES users(id)
    );
  `);

  // Printers
  db.run(`
    CREATE TABLE IF NOT EXISTS printers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      updated_by INTEGER REFERENCES users(id)
    );
  `);

  // Software licenses
  db.run(`
    CREATE TABLE IF NOT EXISTS software (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      software_name TEXT NOT NULL,
      license_key TEXT,
      purchased_quantity INTEGER NOT NULL,
      allocated_quantity INTEGER DEFAULT 0,
      expiry_date DATE,
      version TEXT,
      vendor_name TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'disposed')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      updated_by INTEGER REFERENCES users(id),
      CONSTRAINT check_allocation CHECK (allocated_quantity <= purchased_quantity)
    );
  `);

  // Asset history (audit log)
  db.run(`
    CREATE TABLE IF NOT EXISTS asset_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_type TEXT NOT NULL CHECK(asset_type IN ('pc', 'server', 'network', 'printer', 'software')),
      asset_id INTEGER NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('create', 'update', 'delete', 'dispose')),
      field_name TEXT,
      old_value TEXT,
      new_value TEXT,
      changed_by INTEGER REFERENCES users(id),
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT
    );
  `);

  // Create indexes for performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_pcs_status ON pcs(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_pcs_asset_number ON pcs(asset_number)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_servers_hostname ON servers(hostname)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_network_ips_ip ON network_ips(ip_address)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_network_ips_active ON network_ips(is_active)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_software_expiry ON software(expiry_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_history_asset ON asset_history(asset_type, asset_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_history_date ON asset_history(changed_at)`);

  console.log('Database schema initialized successfully');
}
