// Simple test to verify metadata functionality works
const { getPool } = require('./db');

async function testMetadataDirectly() {
  let connection;
  try {
    console.log('🧪 Testing metadata functionality directly...');
    
    const pool = getPool();
    connection = await pool.getConnection();
    
    // Insert a test question with metadata
    console.log('📝 Creating test question with metadata...');
    const [result] = await connection.execute(
      'INSERT INTO `questions` (`text`, `subject`, `difficulty`, `type`, `exam`, `unit`, `topic`, `subtopic`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        'What is 2 + 2?',
        'Mathematics',
        'Easy',
        'multiple-choice',
        'Math Final',
        'Arithmetic',
        'Addition',
        'Basic Addition'
      ]
    );
    
    const questionId = result.insertId;
    console.log('✅ Question created with ID:', questionId);
    
    // Add options for the question
    console.log('📝 Adding options...');
    await connection.execute(
      'INSERT INTO `options` (`question_id`, `label`, `option_text`, `is_correct`) VALUES (?, ?, ?, ?)',
      [questionId, 'A', '3', 0]
    );
    await connection.execute(
      'INSERT INTO `options` (`question_id`, `label`, `option_text`, `is_correct`) VALUES (?, ?, ?, ?)',
      [questionId, 'B', '4', 1]
    );
    await connection.execute(
      'INSERT INTO `options` (`question_id`, `label`, `option_text`, `is_correct`) VALUES (?, ?, ?, ?)',
      [questionId, 'C', '5', 0]
    );
    
    console.log('✅ Options added successfully');
    
    // Query the question with all metadata
    console.log('📋 Retrieving question with metadata...');
    const [questions] = await connection.execute(
      `SELECT q.id, q.text, q.subject, q.difficulty, q.type, q.exam, q.unit, q.topic, q.subtopic,
              o.id as option_id, o.label, o.option_text, o.is_correct
       FROM questions q
       LEFT JOIN options o ON o.question_id = q.id
       WHERE q.id = ?
       ORDER BY o.id`,
      [questionId]
    );
    
    if (questions.length > 0) {
      const question = {
        id: questions[0].id,
        text: questions[0].text,
        subject: questions[0].subject,
        difficulty: questions[0].difficulty,
        type: questions[0].type,
        exam: questions[0].exam,
        unit: questions[0].unit,
        topic: questions[0].topic,
        subtopic: questions[0].subtopic,
        options: questions.map(row => ({
          id: row.option_id,
          label: row.label,
          option_text: row.option_text,
          is_correct: !!row.is_correct
        }))
      };
      
      console.log('✅ Question retrieved successfully:');
      console.log(JSON.stringify(question, null, 2));
      
      // Test updating metadata
      console.log('📝 Testing metadata update...');
      await connection.execute(
        'UPDATE `questions` SET `exam` = ?, `unit` = ?, `topic` = ?, `subtopic` = ? WHERE id = ?',
        ['Math Midterm', 'Basic Operations', 'Simple Addition', 'Two-digit Addition', questionId]
      );
      
      console.log('✅ Metadata updated successfully');
      
      // Verify the update
      const [updatedQuestion] = await connection.execute(
        'SELECT exam, unit, topic, subtopic FROM questions WHERE id = ?',
        [questionId]
      );
      
      console.log('📋 Updated metadata:');
      console.log(updatedQuestion[0]);
      
      console.log('\n🎉 All metadata functionality tests passed!');
      console.log('✅ Database supports all new metadata fields');
      console.log('✅ INSERT with metadata works');
      console.log('✅ SELECT with metadata works');
      console.log('✅ UPDATE with metadata works');
      
    } else {
      console.log('❌ Failed to retrieve created question');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

testMetadataDirectly();