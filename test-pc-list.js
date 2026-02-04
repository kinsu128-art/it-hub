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

async function testPcList() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to MSSQL Server\n');

    // Test 1: Simple query to check if data exists
    console.log('Test 1: Check if PCs exist');
    console.log('─'.repeat(60));
    const countResult = await sql.query(`SELECT COUNT(*) as count FROM pcs`);
    console.log(`Total PCs: ${countResult.recordset[0].count}\n`);

    // Test 2: Simple SELECT without pagination
    console.log('Test 2: Simple SELECT (no pagination)');
    console.log('─'.repeat(60));
    const simpleResult = await sql.query(`SELECT TOP 5 * FROM pcs`);
    console.log(`Found ${simpleResult.recordset.length} PCs`);
    if (simpleResult.recordset.length > 0) {
      console.log('First PC:', simpleResult.recordset[0]);
    }
    console.log('\n');

    // Test 3: Query with OFFSET-FETCH (page 1)
    console.log('Test 3: Query with OFFSET-FETCH (page 1)');
    console.log('─'.repeat(60));
    try {
      const page1Query = `
        SELECT * FROM pcs
        WHERE 1=1
        ORDER BY created_at DESC
        OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY
      `;
      const page1Result = await sql.query(page1Query);
      console.log(`✅ Success! Found ${page1Result.recordset.length} PCs`);
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }
    console.log('\n');

    // Test 4: Query with OFFSET-FETCH (page 2)
    console.log('Test 4: Query with OFFSET-FETCH (page 2)');
    console.log('─'.repeat(60));
    try {
      const page2Query = `
        SELECT * FROM pcs
        WHERE 1=1
        ORDER BY created_at DESC
        OFFSET 20 ROWS FETCH NEXT 20 ROWS ONLY
      `;
      const page2Result = await sql.query(page2Query);
      console.log(`✅ Success! Found ${page2Result.recordset.length} PCs`);
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }
    console.log('\n');

    // Test 5: Query with search and OFFSET-FETCH
    console.log('Test 5: Query with search and OFFSET-FETCH');
    console.log('─'.repeat(60));
    try {
      const searchQuery = `
        SELECT * FROM pcs
        WHERE 1=1 AND (asset_number LIKE @param1 OR model_name LIKE @param1 OR user_name LIKE @param1 OR serial_number LIKE @param1)
        ORDER BY created_at DESC
        OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY
      `;
      const request = new sql.Request();
      request.input('param1', '%TEST%');
      const searchResult = await request.query(searchQuery);
      console.log(`✅ Success! Found ${searchResult.recordset.length} PCs`);
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.close();
  }
}

testPcList();
