const { getPool } = require('./db');
const bcrypt = require('bcrypt');

async function setupInitialData() {
  const pool = getPool();
  
  try {
    console.log('🔄 Setting up initial data in Aiven database...');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT IGNORE INTO users (name, email, password_hash, role) 
      VALUES (?, ?, ?, ?)
    `, ['Admin User', 'admin@admin.com', hashedPassword, 'admin']);
    
    console.log('✅ Admin user created/updated');
    
    // Create sample student user
    const studentPassword = await bcrypt.hash('student123', 10);
    await pool.query(`
      INSERT IGNORE INTO users (name, email, password_hash, role) 
      VALUES (?, ?, ?, ?)
    `, ['Student User', 'student@test.com', studentPassword, 'student']);
    
    console.log('✅ Sample student user created/updated');
    
    // Add sample questions
    const questions = [
      {
        text: 'What is 2 + 2?',
        subject: 'Math',
        difficulty: 'easy',
        type: 'mcq',
        options: [
          { label: 'A', text: '3', correct: false },
          { label: 'B', text: '4', correct: true },
          { label: 'C', text: '5', correct: false }
        ]
      },
      {
        text: 'What is the capital of France?',
        subject: 'Geography',
        difficulty: 'easy',
        type: 'mcq',
        options: [
          { label: 'A', text: 'London', correct: false },
          { label: 'B', text: 'Berlin', correct: false },
          { label: 'C', text: 'Paris', correct: true },
          { label: 'D', text: 'Madrid', correct: false }
        ]
      },
      {
        text: 'What is 5 × 3?',
        subject: 'Math',
        difficulty: 'easy',
        type: 'mcq',
        options: [
          { label: 'A', text: '15', correct: true },
          { label: 'B', text: '12', correct: false },
          { label: 'C', text: '18', correct: false }
        ]
      }
    ];
    
    for (const q of questions) {
      // Check if question already exists
      const [existing] = await pool.query('SELECT id FROM questions WHERE text = ?', [q.text]);
      
      if (existing.length === 0) {
        // Insert question
        const [result] = await pool.query(`
          INSERT INTO questions (text, subject, difficulty, type) 
          VALUES (?, ?, ?, ?)
        `, [q.text, q.subject, q.difficulty, q.type]);
        
        const questionId = result.insertId;
        
        // Insert options
        for (const option of q.options) {
          await pool.query(`
            INSERT INTO options (question_id, label, option_text, is_correct) 
            VALUES (?, ?, ?, ?)
          `, [questionId, option.label, option.text, option.correct ? 1 : 0]);
        }
        
        console.log(`✅ Added question: "${q.text}"`);
      } else {
        console.log(`ℹ️  Question already exists: "${q.text}"`);
      }
    }
    
    console.log('\n🎉 Initial data setup complete!');
    console.log('\n📋 Login credentials:');
    console.log('Admin: admin@admin.com / admin123');
    console.log('Student: student@test.com / student123');
    
  } catch (error) {
    console.error('❌ Error setting up initial data:', error);
  } finally {
    process.exit();
  }
}

setupInitialData();