const mysql = require('mysql2/promise');

async function makeUserAdmin() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'appuser',
    password: 'StrongP@ssw0rd!',
    database: 'studentquiz',
    connectionLimit: 10
  });
  
  try {
    const [result] = await pool.query("UPDATE users SET role = 'admin' WHERE email = 'admin@admin.com'");
    console.log('✅ User role updated to admin:', result.affectedRows, 'rows affected');
    
    // Verify the update
    const [users] = await pool.query("SELECT id, email, role FROM users WHERE email = 'admin@admin.com'");
    console.log('Updated user:', users[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

makeUserAdmin();