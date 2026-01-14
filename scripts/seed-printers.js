const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const printers = [
  {
    asset_number: 'PRT-2024-001',
    model_name: 'HP LaserJet Pro M404n',
    ip_address: '192.168.1.50',
    location: '3층 회의실',
    toner_status: '95%',
    drum_status: '정상',
    status: 'active',
    vendor_name: 'HP Inc.',
    vendor_contact: '1600-1234',
    notes: '부서 공유 프린터 - 주로 보고서 인쇄용'
  },
  {
    asset_number: 'PRT-2024-002',
    model_name: 'Canon imagePRESS C7570',
    ip_address: '192.168.1.51',
    location: '2층 인쇄실',
    toner_status: '60%',
    drum_status: '교체 예정',
    status: 'active',
    vendor_name: 'Canon',
    vendor_contact: '02-1234-5678',
    notes: '고속 인쇄용 컬러 프린터'
  },
  {
    asset_number: 'PRT-2024-003',
    model_name: 'Xerox VersaLink C405',
    ip_address: '192.168.1.52',
    location: '1층 로비',
    toner_status: '40%',
    drum_status: '정상',
    status: 'inactive',
    vendor_name: 'Xerox',
    vendor_contact: '1577-0077',
    notes: '비상용 프린터'
  },
  {
    asset_number: 'PRT-2024-004',
    model_name: 'Brother HL-L8360CDW',
    ip_address: '192.168.1.53',
    location: '4층 개발팀',
    toner_status: '75%',
    drum_status: '정상',
    status: 'active',
    vendor_name: 'Brother Industries',
    vendor_contact: '080-000-1111',
    notes: '개발팀 전용 프린터'
  },
  {
    asset_number: 'PRT-2024-005',
    model_name: 'Ricoh MP C3003',
    ip_address: '192.168.1.54',
    location: '지하1층 문서실',
    toner_status: '30%',
    drum_status: '주의',
    status: 'repair',
    vendor_name: 'Ricoh',
    vendor_contact: '1544-1234',
    notes: '토너 교체 필요 - 현재 수리중'
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

    console.log('\n📝 Adding 5 test printers...');
    
    for (const printer of printers) {
      try {
        // Check if printer already exists
        const existingResult = await client.query(
          'SELECT id FROM printers WHERE asset_number = $1',
          [printer.asset_number]
        );

        if (existingResult.rows.length > 0) {
          console.log(`⚠️  Printer ${printer.asset_number} already exists, skipping...`);
          continue;
        }

        // Insert new printer
        const insertResult = await client.query(
          `INSERT INTO printers (asset_number, model_name, ip_address, location, toner_status, drum_status, status, vendor_name, vendor_contact, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           RETURNING id`,
          [printer.asset_number, printer.model_name, printer.ip_address, printer.location, printer.toner_status, printer.drum_status, printer.status, printer.vendor_name, printer.vendor_contact, printer.notes]
        );

        const newPrinterId = insertResult.rows[0].id;

        // Record history
        await client.query(
          `INSERT INTO asset_history (asset_type, asset_id, action, changed_by, changed_at, field_name, old_value, new_value)
           VALUES ($1, $2, $3, $4, NOW(), NULL, NULL, NULL)`,
          ['printer', newPrinterId, 'create', adminId]
        );

        console.log(`✅ Created printer: ${printer.asset_number} (ID: ${newPrinterId})`);
      } catch (err) {
        console.error(`❌ Error processing ${printer.asset_number}:`, err.message);
      }
    }

    client.release();
    console.log('\n✅ Printer seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }
})();
