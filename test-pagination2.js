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

async function testPagination() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to MSSQL Server\n');

    // Test ROW_NUMBER() pagination with @param directly
    console.log('Test: ROW_NUMBER() with direct @param syntax');
    console.log('─'.repeat(60));
    const query = `
      WITH PaginatedData AS (
        SELECT *, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS RowNum
        FROM pcs WHERE 1=1
      )
      SELECT * FROM PaginatedData
      WHERE RowNum BETWEEN @startRow AND @endRow
    `;

    const request = new sql.Request();
    request.input('startRow', sql.Int, 1);
    request.input('endRow', sql.Int, 20);

    const result = await request.query(query);
    console.log(`✅ Success! Found ${result.recordset.length} PCs`);
    if (result.recordset.length > 0) {
      console.log('First PC:', {
        id: result.recordset[0].id,
        asset_number: result.recordset[0].asset_number,
        model_name: result.recordset[0].model_name,
        RowNum: result.recordset[0].RowNum
      });
    }
    console.log('\n');

    // Test with search
    console.log('Test: ROW_NUMBER() with search');
    console.log('─'.repeat(60));
    const query2 = `
      WITH PaginatedData AS (
        SELECT *, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS RowNum
        FROM pcs WHERE (asset_number LIKE @search OR model_name LIKE @search)
      )
      SELECT * FROM PaginatedData
      WHERE RowNum BETWEEN @startRow AND @endRow
    `;

    const request2 = new sql.Request();
    request2.input('search', '%TEST%');
    request2.input('startRow', sql.Int, 1);
    request2.input('endRow', sql.Int, 20);

    const result2 = await request2.query(query2);
    console.log(`✅ Success! Found ${result2.recordset.length} PCs`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.close();
  }
}

testPagination();
