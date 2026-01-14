const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const networkIPs = [
  {
    ip_address: '192.168.1.10',
    subnet_mask: '255.255.255.0',
    gateway: '192.168.1.1',
    assigned_device: 'Web Server 01',
    vlan_id: '100',
    is_active: true,
    notes: 'Production web server - main gateway'
  },
  {
    ip_address: '192.168.1.11',
    subnet_mask: '255.255.255.0',
    gateway: '192.168.1.1',
    assigned_device: 'DB Server 01',
    vlan_id: '100',
    is_active: true,
    notes: 'Primary database server'
  },
  {
    ip_address: '192.168.2.20',
    subnet_mask: '255.255.255.0',
    gateway: '192.168.2.1',
    assigned_device: 'Management Server',
    vlan_id: '200',
    is_active: true,
    notes: 'Network management and monitoring'
  },
  {
    ip_address: '192.168.3.50',
    subnet_mask: '255.255.255.0',
    gateway: '192.168.3.1',
    assigned_device: 'Reserved',
    vlan_id: '300',
    is_active: false,
    notes: 'Reserved for future use'
  },
  {
    ip_address: '10.0.0.100',
    subnet_mask: '255.255.255.0',
    gateway: '10.0.0.1',
    assigned_device: 'Backup Server',
    vlan_id: '400',
    is_active: true,
    notes: 'Backup and disaster recovery'
  }
];

(async () => {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Supabase PostgreSQL...');
    const client = await pool.connect();

    // Get admin user
    const adminResult = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (adminResult.rows.length === 0) {
      console.error('❌ Admin user not found');
      client.release();
      process.exit(1);
    }
    const adminId = adminResult.rows[0].id;
    console.log(`✅ Found admin user (ID: ${adminId})`);

    console.log('\n📝 Adding 5 test network IPs...');
    
    for (const ip of networkIPs) {
      try {
        // Check if IP already exists
        const existingResult = await client.query(
          'SELECT id FROM network_ips WHERE ip_address = $1',
          [ip.ip_address]
        );

        if (existingResult.rows.length > 0) {
          console.log(`⚠️  IP ${ip.ip_address} already exists, skipping...`);
          continue;
        }

        // Insert new IP
        const insertResult = await client.query(
          `INSERT INTO network_ips (ip_address, subnet_mask, gateway, assigned_device, vlan_id, is_active, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           RETURNING id`,
          [ip.ip_address, ip.subnet_mask, ip.gateway, ip.assigned_device, ip.vlan_id, ip.is_active, ip.notes]
        );

        const newIPId = insertResult.rows[0].id;

        // Record history
        await client.query(
          `INSERT INTO asset_history (asset_type, asset_id, action, changed_by, changed_at, field_name, old_value, new_value)
           VALUES ($1, $2, $3, $4, NOW(), NULL, NULL, NULL)`,
          ['network', newIPId, 'create', adminId]
        );

        console.log(`✅ Created IP: ${ip.ip_address} (ID: ${newIPId})`);
      } catch (err) {
        console.error(`❌ Error processing ${ip.ip_address}:`, err.message);
      }
    }

    client.release();
    console.log('\n✅ Network IP seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }
})();
