const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const config = {
  server: process.env.DB_SERVER || '192.168.1.11',
  port: parseInt(process.env.DB_PORT || '2433'),
  database: process.env.DB_DATABASE || 'dk_it',
  user: process.env.DB_USER || 'dkenterb',
  password: process.env.DB_PASSWORD || 'Micro@4580',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

async function checkTableStructure() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to MSSQL Server\n');

    // Check pcs table structure
    const result = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'pcs'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📋 pcs 테이블 구조:');
    console.log('─'.repeat(100));
    console.log('순위 | 컬럼명                    | 데이터 타입       | 최대 길이 | NULL | 기본값');
    console.log('─'.repeat(100));

    result.recordset.forEach((col, index) => {
      const maxLength = col.CHARACTER_MAXIMUM_LENGTH || '-';
      const defaultVal = col.COLUMN_DEFAULT || '-';
      console.log(
        `${String(index + 1).padStart(4)} | ${col.COLUMN_NAME.padEnd(24)} | ${col.DATA_TYPE.padEnd(16)} | ${String(maxLength).padStart(8)} | ${col.IS_NULLABLE.padStart(4)} | ${defaultVal}`
      );
    });

    console.log('─'.repeat(100));
    console.log(`\n총 컬럼 수: ${result.recordset.length}\n`);

    // Check if table needs to be recreated
    const hasCreatedAt = result.recordset.some(col => col.COLUMN_NAME === 'created_at');
    const hasUpdatedAt = result.recordset.some(col => col.COLUMN_NAME === 'updated_at');

    if (!hasCreatedAt || !hasUpdatedAt) {
      console.log('⚠️  테이블에 created_at 또는 updated_at 컬럼이 없습니다!');
      console.log('📝 init-db-mssql.sql 스크립트를 실행하여 테이블을 다시 생성하세요.\n');
    } else {
      console.log('✅ 테이블 구조가 올바릅니다.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.number === 208) {
      console.log('\n⚠️  pcs 테이블이 존재하지 않습니다!');
      console.log('📝 init-db-mssql.sql 스크립트를 먼저 실행하세요:\n');
      console.log('sqlcmd -S 192.168.1.11,2433 -U dkenterb -P Micro@4580 -i scripts/init-db-mssql.sql\n');
    }
  } finally {
    await sql.close();
  }
}

checkTableStructure();
