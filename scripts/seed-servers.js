const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config({ path: '.env.local' });

// DNS 우회: IPv6 주소로 직접 연결
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

async function seedServers() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Supabase PostgreSQL...');
    const client = await pool.connect();

    // 먼저 admin 사용자 ID 조회
    const userResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );

    if (userResult.rows.length === 0) {
      console.error('❌ Admin user not found. Please run npm run db:init first.');
      client.release();
      await pool.end();
      process.exit(1);
    }

    const adminUserId = userResult.rows[0].id;
    console.log(`✅ Found admin user (ID: ${adminUserId})`);

    // 테스트 서버 데이터
    const testServers = [
      {
        asset_number: 'SRV-2024-001',
        rack_location: 'Rack A-1',
        hostname: 'web-server-01',
        os_version: 'Ubuntu 22.04 LTS',
        ip_address: '192.168.1.100',
        purpose: 'Web Server',
        warranty_expiry: '2025-12-31',
        cpu: 'Intel Xeon Silver 4210 (20 cores)',
        ram: '64GB DDR4',
        disk: '1TB SSD + 2TB HDD',
        status: 'active',
        notes: '프로덕션 웹 서버 - 트래픽 처리용'
      },
      {
        asset_number: 'SRV-2024-002',
        rack_location: 'Rack A-2',
        hostname: 'db-server-01',
        os_version: 'Ubuntu 20.04 LTS',
        ip_address: '192.168.1.101',
        purpose: 'Database Server',
        warranty_expiry: '2025-12-31',
        cpu: 'Intel Xeon Gold 6240 (18 cores)',
        ram: '128GB DDR4',
        disk: '2TB NVMe SSD',
        status: 'active',
        notes: '프로덕션 데이터베이스 서버'
      },
      {
        asset_number: 'SRV-2024-003',
        rack_location: 'Rack B-1',
        hostname: 'app-server-01',
        os_version: 'CentOS 7',
        ip_address: '192.168.1.102',
        purpose: 'Application Server',
        warranty_expiry: '2025-06-30',
        cpu: 'Intel Xeon E5-2680 (16 cores)',
        ram: '32GB DDR4',
        disk: '500GB SSD',
        status: 'active',
        notes: '어플리케이션 서버 - Java 런타임'
      },
      {
        asset_number: 'SRV-2024-004',
        rack_location: 'Rack B-2',
        hostname: 'backup-server-01',
        os_version: 'Windows Server 2022',
        ip_address: '192.168.1.103',
        purpose: 'Backup & Storage',
        warranty_expiry: '2026-01-31',
        cpu: 'Intel Xeon Platinum 8260 (24 cores)',
        ram: '96GB DDR4',
        disk: '10TB RAID 6',
        status: 'active',
        notes: '백업 및 저장소 서버'
      },
      {
        asset_number: 'SRV-2024-005',
        rack_location: 'Rack C-1',
        hostname: 'monitoring-server-01',
        os_version: 'Debian 11',
        ip_address: '192.168.1.104',
        purpose: 'Monitoring & Management',
        warranty_expiry: '2025-09-30',
        cpu: 'Intel Core i7-10700K (8 cores)',
        ram: '16GB DDR4',
        disk: '500GB SSD',
        status: 'inactive',
        notes: '모니터링 및 관리 서버 - 현재 유지보수 중'
      }
    ];

    console.log(`\n📝 Adding ${testServers.length} test servers...`);

    for (let i = 0; i < testServers.length; i++) {
      const server = testServers[i];

      // 중복 확인
      const existing = await client.query(
        'SELECT id FROM servers WHERE asset_number = $1',
        [server.asset_number]
      );

      if (existing.rows.length > 0) {
        console.log(`⚠️  Server ${server.asset_number} already exists, skipping...`);
        continue;
      }

      const result = await client.query(
        `INSERT INTO servers (
          asset_number, rack_location, hostname, os_version, ip_address,
          purpose, warranty_expiry, cpu, ram, disk, status, notes, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id`,
        [
          server.asset_number,
          server.rack_location,
          server.hostname,
          server.os_version,
          server.ip_address,
          server.purpose,
          server.warranty_expiry,
          server.cpu,
          server.ram,
          server.disk,
          server.status,
          server.notes,
          adminUserId,
          adminUserId
        ]
      );

      const serverId = result.rows[0].id;
      console.log(`✅ Created server: ${server.asset_number} (ID: ${serverId}) - ${server.hostname}`);

      // 히스토리 기록
      await client.query(
        `INSERT INTO asset_history (
          asset_type, asset_id, action, changed_by, changed_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        ['server', serverId, 'create', adminUserId]
      );
    }

    console.log('\n✅ Server seeding complete!');
    client.release();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedServers();
