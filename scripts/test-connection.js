require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

console.log('🔍 Connection String Check:');
console.log('─'.repeat(50));

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

// Parse and display connection info
const url = new URL(`postgresql://${connectionString.split('://')[1]}`);
console.log(`✓ Host: ${url.hostname}`);
console.log(`✓ Port: ${url.port}`);
console.log(`✓ Database: ${url.pathname.replace('/', '')}`);
console.log(`✓ User: ${url.username}`);
console.log(`✓ SSL: ${url.searchParams.get('sslmode') || 'default'}`);

console.log('\n🧪 Testing Connection...');
console.log('─'.repeat(50));

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

pool.connect(async (err, client, release) => {
  if (err) {
    console.error('❌ Connection Failed:');
    console.error(`   Error: ${err.message}`);
    console.error(`   Code: ${err.code}`);
    process.exit(1);
  }

  try {
    const result = await client.query('SELECT version()');
    console.log('✅ Connection Successful!');
    console.log(`\nDatabase Information:`);
    console.log(result.rows[0].version);
  } catch (err) {
    console.error('❌ Query Failed:', err.message);
  } finally {
    release();
    await pool.end();
  }
});
