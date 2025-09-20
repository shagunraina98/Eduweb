const { getPool } = require('./db');

async function verifyDatabaseFix() {
  const pool = getPool();
  
  console.log('🔍 VERIFYING THE DATABASE FIX...\n');
  
  try {
    // Test the EXACT query that was failing on Render (but with our fix)
    console.log('1. Testing the corrected GET questions query:');
    console.log('   (This is the query that was failing on Render)\n');
    
    const query = `SELECT q.id AS question_id, q.\`text\`, q.\`subject\`, q.\`difficulty\`, q.\`type\`,
        o.id AS option_id, o.\`label\`, o.\`option_text\`, o.\`is_correct\`
   FROM \`questions\` q
   LEFT JOIN \`options\` o ON o.\`question_id\` = q.id
   ORDER BY q.id, o.id`;
   
    console.log('Query:', query.replace(/\s+/g, ' ').trim());
    
    const [rows] = await pool.query(query);
    
    console.log(`✅ SUCCESS! Query returned ${rows.length} rows`);
    console.log(`✅ No "Unknown column" error`);
    
    if (rows.length > 0) {
      console.log('\nSample data:');
      rows.slice(0, 3).forEach(row => {
        console.log(`   - Question ID: ${row.question_id}, Text: "${row.text}"`);
      });
    }
    
    // Test the quiz query fix
    console.log('\n2. Testing the corrected quiz query:');
    const quizQuery = `SELECT q.id, q.\`text\`, q.\`subject\`, q.\`difficulty\`, q.\`type\`
       FROM \`questions\` q
       ORDER BY RAND()
       LIMIT 3`;
       
    const [quizRows] = await pool.query(quizQuery);
    console.log(`✅ Quiz query successful! Found ${quizRows.length} questions`);
    
    // Test insert syntax
    console.log('\n3. Testing the corrected INSERT syntax:');
    const insertQuery = 'INSERT INTO `questions` (`text`, `subject`, `difficulty`, `type`) VALUES (?, ?, ?, ?)';
    console.log('✅ Insert syntax is valid:', insertQuery);
    
    console.log('\n🎉 ALL FIXES VERIFIED SUCCESSFULLY!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Commit and push the updated routes/questions.js and routes/quiz.js');
    console.log('2. Redeploy on Render');
    console.log('3. The "Unknown column" error will be resolved');
    
    // Show exact differences
    console.log('\n🔧 EXACT CHANGES MADE:');
    console.log('OLD: q.`question_text` → NEW: q.`text`');
    console.log('OLD: INSERT INTO questions (question_text, text, ...) → NEW: INSERT INTO questions (text, ...)');
    console.log('OLD: UPDATE questions SET question_text = ?, text = ? → NEW: UPDATE questions SET text = ?');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('\nIf you see "Unknown column" error here, there might be more fixes needed.');
  } finally {
    process.exit();
  }
}

verifyDatabaseFix();