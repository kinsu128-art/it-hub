// Test INSERT query locally
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

// Helper function to convert ? placeholders to MSSQL @param syntax
function convertPlaceholders(sqlQuery, params) {
  let paramIndex = 1;
  const convertedQuery = sqlQuery.replace(/\?/g, () => `@param${paramIndex++}`);
  return { query: convertedQuery, params };
}

async function testInsert() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to MSSQL Server\n');

    // Test the exact INSERT query from the API
    const insertQuery = `INSERT INTO pcs (
      asset_number, user_name, department, model_name, serial_number,
      purchase_date, cpu, ram, disk, status, notes, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    console.log('Original query:');
    console.log(insertQuery);
    console.log('\n');

    // Remove RETURNING clause if exists
    let cleanedSql = insertQuery.replace(/RETURNING\s+\w+/gi, '').trim();

    console.log('After removing RETURNING:');
    console.log(cleanedSql);
    console.log('\n');

    // Add OUTPUT INSERTED.id for MSSQL to get the last inserted ID
    if (!cleanedSql.toUpperCase().includes('OUTPUT')) {
      cleanedSql = cleanedSql.replace(
        /INSERT\s+INTO\s+(\w+)\s*\(/i,
        'INSERT INTO $1 OUTPUT INSERTED.id ('
      );
    }

    console.log('After adding OUTPUT:');
    console.log(cleanedSql);
    console.log('\n');

    const { query, params: convertedParams } = convertPlaceholders(cleanedSql, []);

    console.log('Final MSSQL query:');
    console.log(query);
    console.log('\n');

    // Count columns and placeholders
    const columnMatch = query.match(/INSERT INTO pcs OUTPUT INSERTED.id \(([\s\S]*?)\) VALUES/);
    if (columnMatch) {
      const columns = columnMatch[1].split(',').map(c => c.trim());
      console.log(`Number of columns: ${columns.length}`);
      console.log('Columns:', columns);
    }

    const paramMatch = query.match(/VALUES \((.*?)\)/);
    if (paramMatch) {
      const params = paramMatch[1].split(',').map(p => p.trim());
      console.log(`\nNumber of parameters: ${params.length}`);
      console.log('Parameters:', params);
    }

    // Try to actually execute the query with test data
    console.log('\n🧪 Testing INSERT with sample data...\n');

    const values = [
      'TEST-002',    // asset_number
      null,          // user_name
      null,          // department
      'Test Model',  // model_name
      null,          // serial_number
      null,          // purchase_date
      null,          // cpu
      null,          // ram
      null,          // disk
      'in_stock',    // status
      null,          // notes
      1,             // created_by
      1              // updated_by
    ];

    const request = new sql.Request();

    // Add parameters to request
    values.forEach((param, index) => {
      request.input(`param${index + 1}`, param);
    });

    console.log('Parameters:', values);
    console.log('\nExecuting query...\n');

    const result = await request.query(query);
    console.log('✅ INSERT successful!');
    console.log('Inserted ID:', result.recordset[0].id);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.close();
  }
}

testInsert();
