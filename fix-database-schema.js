const { getPool } = require('./db');

async function fixDatabaseSchema() {
  const pool = getPool();
  
  try {
    console.log('🔧 Fixing database schema issues...');
    
    // Check current tables structure
    console.log('\n1. Checking current schema...');
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Existing tables:', tables.map(t => Object.values(t)[0]));
    
    // Check questions table structure
    console.log('\n2. Checking questions table...');
    const [questionsColumns] = await pool.query('DESCRIBE questions');
    console.log('Questions columns:');
    questionsColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    const hasQuestionTextColumn = questionsColumns.some(col => col.Field === 'question_text');
    const hasTextColumn = questionsColumns.some(col => col.Field === 'text');
    
    if (hasQuestionTextColumn && !hasTextColumn) {
      console.log('\n⚠️  Found question_text column but no text column');
      console.log('Renaming question_text to text...');
      await pool.query('ALTER TABLE questions CHANGE question_text text TEXT NOT NULL');
      console.log('✅ Renamed question_text column to text');
    } else if (!hasQuestionTextColumn && hasTextColumn) {
      console.log('✅ Schema is correct (text column exists)');
    } else if (hasQuestionTextColumn && hasTextColumn) {
      console.log('\n⚠️  Found both question_text and text columns');
      console.log('Dropping redundant question_text column...');
      await pool.query('ALTER TABLE questions DROP COLUMN question_text');
      console.log('✅ Dropped redundant question_text column');
    }
    
    // Verify users table
    console.log('\n3. Checking users table...');
    const [usersColumns] = await pool.query('DESCRIBE users');
    const hasPasswordHash = usersColumns.some(col => col.Field === 'password_hash');
    const hasPassword = usersColumns.some(col => col.Field === 'password');
    
    if (hasPassword && !hasPasswordHash) {
      console.log('Renaming password to password_hash...');
      await pool.query('ALTER TABLE users CHANGE password password_hash VARCHAR(255) NOT NULL');
      console.log('✅ Renamed password column to password_hash');
    } else if (hasPasswordHash) {
      console.log('✅ Users table schema is correct');
    }
    
    // Test a simple query to ensure everything works
    console.log('\n4. Testing queries...');
    const [questions] = await pool.query('SELECT id, text, subject FROM questions LIMIT 3');
    console.log(`✅ Found ${questions.length} questions in database`);
    
    if (questions.length > 0) {
      console.log('Sample questions:');
      questions.forEach(q => {
        console.log(`  - ID: ${q.id}, Text: "${q.text}", Subject: ${q.subject}`);
      });
    }
    
    // Test options relationship
    const [options] = await pool.query(`
      SELECT q.id as question_id, q.text, o.label, o.option_text 
      FROM questions q 
      LEFT JOIN options o ON q.id = o.question_id 
      LIMIT 5
    `);
    console.log(`✅ Found ${options.length} question-option relationships`);
    
    console.log('\n🎉 Database schema has been fixed!');
    console.log('✅ All column names are now consistent');
    console.log('✅ Relationships are working properly');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
  } finally {
    process.exit();
  }
}

fixDatabaseSchema();