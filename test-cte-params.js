const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

// Helper function from lib/db/index.ts
function convertPlaceholders(sqlQuery, params) {
  let paramIndex = 1;
  const convertedQuery = sqlQuery.replace(/\?/g, () => `@param${paramIndex++}`);
  return { query: convertedQuery, params };
}

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

async function testCteWithParams() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to MSSQL Server\n');

    // Test with convertPlaceholders (like runQuery does)
    console.log('Test: Using convertPlaceholders helper (like runQuery)');
    console.log('─'.repeat(60));
    const rawQuery = `
      WITH PaginatedData AS (
        SELECT *, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS RowNum
        FROM pcs WHERE 1=1
      )
      SELECT * FROM PaginatedData
      WHERE RowNum BETWEEN ? AND ?
    `;

    const params = [1, 20]; // offset + 1, offset + limit
    const { query, params: convertedParams } = convertPlaceholders(rawQuery, params);

    console.log('Converted query:', query.trim());
    console.log('Parameters:', convertedParams);
    console.log('\nExecuting...\n');

    const request = new sql.Request();
    convertedParams.forEach((param, index) => {
      request.input(`param${index + 1}`, sql.Int, param);
    });

    const result = await request.query(query);
    console.log(`✅ Success! Found ${result.recordset.length} PCs`);

    if (result.recordset.length > 0) {
      console.log('First result:', {
        id: result.recordset[0].id,
        asset_number: result.recordset[0].asset_number,
        model_name: result.recordset[0].model_name
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.close();
  }
}

testCteWithParams();
