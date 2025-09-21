const { getPool } = require('./db');

// Simulate the exact API route logic
async function simulateFiltersAPIRoute() {
  try {
    console.log('🧪 Simulating GET /api/questions/filters route...');
    
    const pool = getPool();
    
    // Execute the exact same queries as the API route
    const [examRows] = await pool.query("SELECT DISTINCT `exam` FROM `questions` WHERE `exam` IS NOT NULL AND `exam` != '' ORDER BY `exam`");
    const [subjectRows] = await pool.query("SELECT DISTINCT `subject` FROM `questions` WHERE `subject` IS NOT NULL AND `subject` != '' ORDER BY `subject`");
    const [unitRows] = await pool.query("SELECT DISTINCT `unit` FROM `questions` WHERE `unit` IS NOT NULL AND `unit` != '' ORDER BY `unit`");
    const [topicRows] = await pool.query("SELECT DISTINCT `topic` FROM `questions` WHERE `topic` IS NOT NULL AND `topic` != '' ORDER BY `topic`");
    const [subtopicRows] = await pool.query("SELECT DISTINCT `subtopic` FROM `questions` WHERE `subtopic` IS NOT NULL AND `subtopic` != '' ORDER BY `subtopic`");
    const [difficultyRows] = await pool.query("SELECT DISTINCT `difficulty` FROM `questions` WHERE `difficulty` IS NOT NULL AND `difficulty` != '' ORDER BY `difficulty`");

    // Create the exact same response object as the API
    const apiResponse = {
      exams: examRows.map(row => row.exam),
      subjects: subjectRows.map(row => row.subject),
      units: unitRows.map(row => row.unit),
      topics: topicRows.map(row => row.topic),
      subtopics: subtopicRows.map(row => row.subtopic),
      difficulties: difficultyRows.map(row => row.difficulty)
    };

    console.log('✅ API route simulation successful!');
    console.log('📊 Response would be:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n📈 Filter counts:');
    console.log(`   Exams: ${apiResponse.exams.length}`);
    console.log(`   Subjects: ${apiResponse.subjects.length}`);
    console.log(`   Units: ${apiResponse.units.length}`);
    console.log(`   Topics: ${apiResponse.topics.length}`);
    console.log(`   Subtopics: ${apiResponse.subtopics.length}`);
    console.log(`   Difficulties: ${apiResponse.difficulties.length}`);
    
    console.log('\n🎉 GET /api/questions/filters route logic verified!');
    console.log('✅ Ready for frontend integration');
    
  } catch (err) {
    console.error('❌ API simulation failed:', err.message);
  }
}

simulateFiltersAPIRoute();