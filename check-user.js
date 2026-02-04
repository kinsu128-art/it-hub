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

async function checkUser() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to MSSQL Server\n');

    // Check if user id 1 exists
    const result = await sql.query(`SELECT id, username, name FROM users WHERE id = 1`);

    if (result.recordset.length > 0) {
      console.log('✅ User id 1 exists:', result.recordset[0]);
    } else {
      console.log('❌ User id 1 does NOT exist!');
      console.log('\nAvailable users:');
      const allUsers = await sql.query(`SELECT id, username, name FROM users`);
      console.table(allUsers.recordset);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.close();
  }
}

checkUser();
