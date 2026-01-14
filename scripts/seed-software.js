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

async function seedSoftware() {
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

    // 테스트 소프트웨어 데이터
    const testSoftware = [
      {
        software_name: 'Microsoft Windows Server 2022',
        license_key: 'WS2022-XXXXX-XXXXX-XXXXX-XXXXX',
        purchased_quantity: 5,
        allocated_quantity: 3,
        expiry_date: '2027-01-15',
        version: '2022 Datacenter',
        vendor_name: 'Microsoft Corporation',
        status: 'active',
        notes: '데이터센터용 서버 OS 라이선스'
      },
      {
        software_name: 'Oracle Database Enterprise Edition',
        license_key: 'ORACLE-DB-EE-2024-XXXXX',
        purchased_quantity: 2,
        allocated_quantity: 2,
        expiry_date: '2026-06-30',
        version: '21c',
        vendor_name: 'Oracle Corporation',
        status: 'active',
        notes: '프로덕션 데이터베이스 라이선스'
      },
      {
        software_name: 'Cisco Meraki Dashboard',
        license_key: 'MERAKI-LICENSE-2024-XXXXX',
        purchased_quantity: 10,
        allocated_quantity: 8,
        expiry_date: '2025-12-31',
        version: 'Cloud',
        vendor_name: 'Cisco Systems',
        status: 'active',
        notes: '네트워크 관리 및 모니터링 솔루션'
      },
      {
        software_name: 'Fortinet FortiGate Firewall',
        license_key: 'FORTINET-FGT-XXXXX-2024',
        purchased_quantity: 3,
        allocated_quantity: 2,
        expiry_date: '2025-09-15',
        version: '7.2',
        vendor_name: 'Fortinet',
        status: 'active',
        notes: '엔터프라이즈 방화벽 보안 솔루션'
      },
      {
        software_name: 'Autodesk AutoCAD',
        license_key: 'AUTOCAD-2024-XXXXX-YYYYYYY',
        purchased_quantity: 15,
        allocated_quantity: 12,
        expiry_date: '2024-12-31',
        version: '2024',
        vendor_name: 'Autodesk Inc.',
        status: 'expired',
        notes: '설계 및 드래프팅 도구 - 갱신 필요'
      },
      {
        software_name: 'Adobe Creative Cloud (Enterprise)',
        license_key: 'ADOBE-CC-ENT-XXXXX-2024',
        purchased_quantity: 20,
        allocated_quantity: 18,
        expiry_date: '2025-11-30',
        version: '2024',
        vendor_name: 'Adobe Systems',
        status: 'active',
        notes: '디자인 및 멀티미디어 개발 도구'
      },
      {
        software_name: 'Microsoft Office 365 Enterprise',
        license_key: 'O365-ENT-2024-XXXXX',
        purchased_quantity: 50,
        allocated_quantity: 45,
        expiry_date: '2025-03-31',
        version: '365',
        vendor_name: 'Microsoft Corporation',
        status: 'active',
        notes: '생산성 도구 및 클라우드 서비스'
      },
      {
        software_name: 'VMware vSphere Enterprise Plus',
        license_key: 'VMWARE-VSPHERE-ENT-XXXXX',
        purchased_quantity: 4,
        allocated_quantity: 4,
        expiry_date: '2026-08-20',
        version: '8.0',
        vendor_name: 'VMware Inc.',
        status: 'active',
        notes: '가상화 및 클라우드 인프라 플랫폼'
      },
      {
        software_name: 'JetBrains IntelliJ IDEA (Team License)',
        license_key: 'JETBRAINS-IDEA-TEAM-XXXXX',
        purchased_quantity: 8,
        allocated_quantity: 6,
        expiry_date: '2025-07-15',
        version: '2024.1',
        vendor_name: 'JetBrains',
        status: 'active',
        notes: 'Java 개발 환경 및 IDE'
      },
      {
        software_name: 'Slack Enterprise Grid',
        license_key: 'SLACK-EG-2024-XXXXX',
        purchased_quantity: 100,
        allocated_quantity: 85,
        expiry_date: '2025-05-30',
        version: 'Enterprise',
        vendor_name: 'Slack Technologies',
        status: 'active',
        notes: '팀 커뮤니케이션 및 협업 플랫폼'
      }
    ];

    console.log(`\n📝 Adding ${testSoftware.length} test software licenses...`);

    for (let i = 0; i < testSoftware.length; i++) {
      const software = testSoftware[i];

      const result = await client.query(
        `INSERT INTO software (
          software_name, license_key, purchased_quantity, allocated_quantity,
          expiry_date, version, vendor_name, status, notes, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          software.software_name,
          software.license_key,
          software.purchased_quantity,
          software.allocated_quantity,
          software.expiry_date,
          software.version,
          software.vendor_name,
          software.status,
          software.notes,
          adminUserId,
          adminUserId
        ]
      );

      const softwareId = result.rows[0].id;
      console.log(`✅ Created software: ${software.software_name} (ID: ${softwareId})`);

      // 히스토리 기록
      await client.query(
        `INSERT INTO asset_history (
          asset_type, asset_id, action, changed_by, changed_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        ['software', softwareId, 'create', adminUserId]
      );
    }

    console.log('\n✅ Software seeding complete!');
    client.release();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedSoftware();
