const { getPool } = require('./db');

async function addMetadataColumns() {
  let connection;
  
  try {
    console.log('Getting connection from pool...');
    const pool = getPool();
    connection = await pool.getConnection();
    
    console.log('Adding metadata columns to questions table...');
    
    const sql = `
      ALTER TABLE questions
      ADD COLUMN exam VARCHAR(100) NULL,
      ADD COLUMN unit VARCHAR(100) NULL,
      ADD COLUMN topic VARCHAR(100) NULL,
      ADD COLUMN subtopic VARCHAR(100) NULL
    `;
    
    await connection.execute(sql);
    console.log('✅ Successfully added metadata columns to questions table');
    
    // Check the updated table structure
    const [rows] = await connection.execute('DESCRIBE questions');
    console.log('\n📝 Updated questions table structure:');
    console.table(rows);
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ Columns already exist, skipping migration');
      
      // Still check the table structure
      const [rows] = await connection.execute('DESCRIBE questions');
      console.log('\n📝 Current questions table structure:');
      console.table(rows);
    } else {
      console.error('❌ Error adding metadata columns:', error.message);
    }
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

addMetadataColumns();