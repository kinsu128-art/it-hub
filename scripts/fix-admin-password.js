const sql = require('mssql');
const bcrypt = require('bcryptjs');
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

async function fixAdminPassword() {
  try {
    console.log('🔄 Connecting to MSSQL Server...');
    const pool = await sql.connect(config);
    console.log('✅ Connected to MSSQL Server');

    // Generate bcrypt hash for 'admin123'
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(`🔐 Generated password hash for: ${password}`);

    // Update admin user password
    const result = await pool.request()
      .input('username', sql.NVarChar, 'admin')
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query('UPDATE users SET password_hash = @passwordHash WHERE username = @username');

    console.log(`✅ Updated ${result.rowsAffected[0]} user(s)`);
    console.log('\n✨ Admin password updated successfully!');
    console.log('📋 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n🌐 You can now login at: http://localhost:3000/login');

    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAdminPassword();
