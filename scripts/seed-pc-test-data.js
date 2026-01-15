const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const testData = [
  // 0년 (2026년 도입) - 2건
  {
    asset_number: 'PC-2026-001',
    model_name: 'MacBook Pro 16 (2026)',
    serial_number: 'C02Y1000001',
    purchase_date: '2026-01-10',
    user_name: '김철수',
    department: '전산실',
    cpu: 'Apple M4 Max',
    ram: '48GB DDR5',
    disk: '1TB SSD',
    status: 'assigned',
    notes: '최신형 개발용 노트북',
  },
  {
    asset_number: 'PC-2026-002',
    model_name: 'Dell XPS 15',
    serial_number: 'D01Z2000002',
    purchase_date: '2026-01-05',
    user_name: '이영희',
    department: '기획팀',
    cpu: 'Intel Core i9-14900K',
    ram: '32GB DDR5',
    disk: '2TB SSD',
    status: 'assigned',
    notes: '고사양 영상편집용',
  },
  // 1년 (2025년 도입) - 2건
  {
    asset_number: 'PC-2025-001',
    model_name: 'ThinkPad X1 Carbon',
    serial_number: 'PF1Y2000003',
    purchase_date: '2025-06-15',
    user_name: '박준호',
    department: '영업팀',
    cpu: 'Intel Core i7-1370P',
    ram: '16GB DDR5',
    disk: '512GB SSD',
    status: 'assigned',
    notes: '휴대용 비즈니스 노트북',
  },
  {
    asset_number: 'PC-2025-002',
    model_name: 'ASUS VivoBook 15',
    serial_number: 'A15V3000004',
    purchase_date: '2025-09-20',
    user_name: '최민지',
    department: '인사팀',
    cpu: 'AMD Ryzen 7 5700U',
    ram: '16GB DDR4',
    disk: '512GB SSD',
    status: 'assigned',
    notes: '일반 업무용',
  },
  // 2년 (2024년 도입) - 2건
  {
    asset_number: 'PC-2024-001',
    model_name: 'HP EliteBook 840',
    serial_number: 'H24E4000005',
    purchase_date: '2024-03-10',
    user_name: '정성규',
    department: '개발팀',
    cpu: 'Intel Core i5-1340P',
    ram: '8GB DDR5',
    disk: '256GB SSD',
    status: 'assigned',
    notes: '엔트리급 개발용',
  },
  {
    asset_number: 'PC-2024-002',
    model_name: 'LG Gram 16',
    serial_number: 'L16G5000006',
    purchase_date: '2024-08-05',
    user_name: '손지은',
    department: '마케팅팀',
    cpu: 'Intel Core i7-1365U',
    ram: '16GB DDR5',
    disk: '512GB SSD',
    status: 'in_stock',
    notes: '예비용 초경량 노트북',
  },
  // 3년 (2023년 도입) - 1건
  {
    asset_number: 'PC-2023-001',
    model_name: 'MacBook Air M2',
    serial_number: 'C02M1000007',
    purchase_date: '2023-11-20',
    user_name: '임은희',
    department: '디자인팀',
    cpu: 'Apple M2',
    ram: '16GB DDR5',
    disk: '512GB SSD',
    status: 'assigned',
    notes: '디자인 작업용',
  },
  // 4년 (2022년 도입) - 1건
  {
    asset_number: 'PC-2022-001',
    model_name: 'Dell Inspiron 15',
    serial_number: 'D22I6000008',
    purchase_date: '2022-07-18',
    user_name: '한동호',
    department: '총무팀',
    cpu: 'Intel Core i5-12450H',
    ram: '8GB DDR4',
    disk: '512GB SSD',
    status: 'repair',
    notes: '수리 중',
  },
  // 5년 (2021년 도입) - 1건
  {
    asset_number: 'PC-2021-001',
    model_name: 'Lenovo IdeaPad 5',
    serial_number: 'L21I7000009',
    purchase_date: '2021-05-12',
    user_name: '조우진',
    department: '구매팀',
    cpu: 'Intel Core i5-11320H',
    ram: '8GB DDR4',
    disk: '256GB SSD',
    status: 'disposed',
    notes: '노후화로 폐기 예정',
  },
  // 6년 이상 (2019년 도입) - 1건
  {
    asset_number: 'PC-2019-001',
    model_name: 'HP Pavilion 15',
    serial_number: 'H19P8000010',
    purchase_date: '2019-02-28',
    user_name: '윤성호',
    department: '품질팀',
    cpu: 'Intel Core i3-9100H',
    ram: '4GB DDR4',
    disk: '128GB SSD',
    status: 'disposed',
    notes: '구형 기기 폐기',
  },
];

async function seedData() {
  const client = await pool.connect();
  try {
    console.log('PC 테스트 데이터 추가 시작...');

    for (const data of testData) {
      await client.query(
        `INSERT INTO pcs (
          asset_number, model_name, serial_number, purchase_date,
          user_name, department, cpu, ram, disk, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          data.asset_number,
          data.model_name,
          data.serial_number,
          data.purchase_date,
          data.user_name,
          data.department,
          data.cpu,
          data.ram,
          data.disk,
          data.status,
          data.notes,
        ]
      );
      console.log(`✓ ${data.asset_number} - ${data.model_name} (${data.purchase_date})`);
    }

    console.log('\n✅ PC 테스트 데이터 10건 추가 완료!');
    console.log('- 도입 연도: 0년(2건), 1년(2건), 2년(2건), 3년(1건), 4년(1건), 5년(1건), 6+년(1건)');
  } catch (error) {
    console.error('에러 발생:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedData();
