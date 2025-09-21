const { getPool } = require('./db');
const bcrypt = require('bcrypt');

async function createFreshAdmin() {
  let connection;
  try {
    console.log('Getting connection from pool...');
    const pool = getPool();
    connection = await pool.getConnection();
    
    const email = 'test@admin.com';
    const password = 'testpass123';
    const saltRounds = 10;
    
    console.log('Creating fresh admin user...');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Delete existing admin if exists
    await connection.execute('DELETE FROM users WHERE email = ?', [email]);
    
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    await connection.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Test Admin', email, hashedPassword, 'admin']
    );
    
    console.log('✅ Fresh admin user created successfully');
    console.log('Use these credentials to test:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

createFreshAdmin();