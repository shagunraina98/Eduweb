const { getPool } = require('./db');

async function checkTableStructure() {
  const pool = getPool();
  
  try {
    console.log('🔍 Checking table structures...');
    
    const [usersStructure] = await pool.query('DESCRIBE users');
    console.log('\n👥 Users table structure:');
    console.table(usersStructure);
    
    const [questionsStructure] = await pool.query('DESCRIBE questions');
    console.log('\n❓ Questions table structure:');
    console.table(questionsStructure);
    
    const [optionsStructure] = await pool.query('DESCRIBE options');
    console.log('\n📝 Options table structure:');
    console.table(optionsStructure);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

checkTableStructure();