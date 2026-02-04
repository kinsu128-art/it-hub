// Test different OUTPUT syntaxes
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

async function testOutputSyntax() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to MSSQL Server\n');

    const values = [
      'TEST-003',    // asset_number
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

    // Test 1: OUTPUT after table name (current approach)
    console.log('Test 1: OUTPUT INSERTED.id after table name');
    console.log('─'.repeat(60));
    try {
      const query1 = `INSERT INTO pcs OUTPUT INSERTED.id (asset_number, user_name, department, model_name, serial_number, purchase_date, cpu, ram, disk, status, notes, created_by, updated_by) VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, @param10, @param11, @param12, @param13)`;
      const request1 = new sql.Request();
      values.forEach((param, index) => {
        request1.input(`param${index + 1}`, param);
      });
      const result1 = await request1.query(query1);
      console.log('✅ Success! Inserted ID:', result1.recordset[0].id);
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }

    console.log('\n');

    // Test 2: OUTPUT between columns and VALUES
    console.log('Test 2: OUTPUT between column list and VALUES');
    console.log('─'.repeat(60));
    try {
      const query2 = `INSERT INTO pcs (asset_number, user_name, department, model_name, serial_number, purchase_date, cpu, ram, disk, status, notes, created_by, updated_by) OUTPUT INSERTED.id VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, @param10, @param11, @param12, @param13)`;
      const request2 = new sql.Request();
      values.forEach((param, index) => {
        request2.input(`param${index + 1}`, param);
      });
      const result2 = await request2.query(query2);
      console.log('✅ Success! Inserted ID:', result2.recordset[0].id);
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }

    console.log('\n');

    // Test 3: OUTPUT after VALUES (correct MSSQL syntax)
    console.log('Test 3: OUTPUT after VALUES (correct syntax)');
    console.log('─'.repeat(60));
    try {
      const query3 = `INSERT INTO pcs (asset_number, user_name, department, model_name, serial_number, purchase_date, cpu, ram, disk, status, notes, created_by, updated_by) OUTPUT INSERTED.id VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, @param10, @param11, @param12, @param13)`;
      const request3 = new sql.Request();
      values.forEach((param, index) => {
        request3.input(`param${index + 1}`, param);
      });
      const result3 = await request3.query(query3);
      console.log('✅ Success! Inserted ID:', result3.recordset[0].id);
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.close();
  }
}

testOutputSyntax();
