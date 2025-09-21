const { getPool } = require('./db');

async function checkAdminUser() {
  let connection;
  try {
    console.log('Getting connection from pool...');
    const pool = getPool();
    connection = await pool.getConnection();
    
    console.log('Checking for admin user...');
    const [users] = await connection.execute('SELECT id, name, email, role FROM users WHERE role = ?', ['admin']);
    
    if (users.length === 0) {
      console.log('❌ No admin users found in database');
      console.log('Creating admin user...');
      
      const bcrypt = require('bcrypt');
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
      
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, saltRounds);
      
      await connection.execute(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['Admin User', process.env.ADMIN_EMAIL, hashedPassword, 'admin']
      );
      
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Found admin users:');
      console.table(users);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

checkAdminUser();