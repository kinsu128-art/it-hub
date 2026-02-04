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

async function testOffsetFetch() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to MSSQL Server\n');

    // Test with hardcoded values
    console.log('Test 1: Hardcoded values (should work)');
    console.log('─'.repeat(60));
    try {
      const query1 = `SELECT * FROM pcs ORDER BY created_at DESC OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY`;
      const result1 = await sql.query(query1);
      console.log(`✅ Success! Found ${result1.recordset.length} PCs\n`);
    } catch (error) {
      console.log('❌ Failed:', error.message, '\n');
    }

    // Test with named parameters
    console.log('Test 2: Named parameters @offset and @limit');
    console.log('─'.repeat(60));
    try {
      const query2 = `SELECT * FROM pcs ORDER BY created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      const request2 = new sql.Request();
      request2.input('offset', sql.Int, 0);
      request2.input('limit', sql.Int, 20);
      const result2 = await request2.query(query2);
      console.log(`✅ Success! Found ${result2.recordset.length} PCs\n`);
    } catch (error) {
      console.log('❌ Failed:', error.message, '\n');
    }

    // Test with param1, param2 (what convertPlaceholders generates)
    console.log('Test 3: @param1, @param2 (like convertPlaceholders)');
    console.log('─'.repeat(60));
    try {
      const query3 = `SELECT * FROM pcs ORDER BY created_at DESC OFFSET @param1 ROWS FETCH NEXT @param2 ROWS ONLY`;
      const request3 = new sql.Request();
      request3.input('param1', sql.Int, 0);
      request3.input('param2', sql.Int, 20);
      const result3 = await request3.query(query3);
      console.log(`✅ Success! Found ${result3.recordset.length} PCs\n`);
    } catch (error) {
      console.log('❌ Failed:', error.message, '\n');
    }

    // Test with explicit type casting in SQL
    console.log('Test 4: CAST parameters in SQL');
    console.log('─'.repeat(60));
    try {
      const query4 = `SELECT * FROM pcs ORDER BY created_at DESC OFFSET CAST(@param1 AS INT) ROWS FETCH NEXT CAST(@param2 AS INT) ROWS ONLY`;
      const request4 = new sql.Request();
      request4.input('param1', 0);
      request4.input('param2', 20);
      const result4 = await request4.query(query4);
      console.log(`✅ Success! Found ${result4.recordset.length} PCs\n`);
    } catch (error) {
      console.log('❌ Failed:', error.message, '\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.close();
  }
}

testOffsetFetch();
