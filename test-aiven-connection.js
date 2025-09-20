const { getPool, testConnection } = require('./db');

async function testAivenConnection() {
  console.log('🔄 Testing connection to Aiven MySQL database...');
  
  try {
    const success = await testConnection();
    if (success) {
      console.log('✅ Successfully connected to Aiven MySQL database!');
      
      // Test a simple query
      const pool = getPool();
      const [result] = await pool.query('SELECT 1 as test');
      console.log('✅ Test query successful:', result);
      
      // Check if our tables exist
      const [tables] = await pool.query('SHOW TABLES');
      console.log('📋 Existing tables:', tables);
      
      if (tables.length === 0) {
        console.log('ℹ️  No tables found. You may need to run the database migration scripts.');
      }
      
    } else {
      console.log('❌ Failed to connect to database');
    }
  } catch (error) {
    console.error('❌ Connection error:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Tip: Check if the hostname is correct');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Tip: Check username and password');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Tip: Check if the port is correct and firewall allows connection');
    }
  } finally {
    process.exit();
  }
}

testAivenConnection();