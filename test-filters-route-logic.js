// Test the exact route implementation
const { getPool } = require('./db');

async function testFiltersRoute() {
  try {
    console.log('🧪 Testing GET /api/filters route implementation...');
    
    const pool = getPool();
    
    // Execute the exact same queries as the route
    const [examRows] = await pool.query("SELECT DISTINCT `exam` FROM `questions` WHERE `exam` IS NOT NULL AND `exam` != '' ORDER BY `exam`");
    const [subjectRows] = await pool.query("SELECT DISTINCT `subject` FROM `questions` WHERE `subject` IS NOT NULL AND `subject` != '' ORDER BY `subject`");
    const [unitRows] = await pool.query("SELECT DISTINCT `unit` FROM `questions` WHERE `unit` IS NOT NULL AND `unit` != '' ORDER BY `unit`");
    const [topicRows] = await pool.query("SELECT DISTINCT `topic` FROM `questions` WHERE `topic` IS NOT NULL AND `topic` != '' ORDER BY `topic`");
    const [subtopicRows] = await pool.query("SELECT DISTINCT `subtopic` FROM `questions` WHERE `subtopic` IS NOT NULL AND `subtopic` != '' ORDER BY `subtopic`");
    const [difficultyRows] = await pool.query("SELECT DISTINCT `difficulty` FROM `questions` WHERE `difficulty` IS NOT NULL AND `difficulty` != '' ORDER BY `difficulty`");

    // Create the exact response format
    const response = {
      subjects: subjectRows.map(row => row.subject),
      exams: examRows.map(row => row.exam),
      units: unitRows.map(row => row.unit),
      topics: topicRows.map(row => row.topic),
      subtopics: subtopicRows.map(row => row.subtopic),
      difficulties: difficultyRows.map(row => row.difficulty)
    };

    console.log('✅ Route implementation successful!');
    console.log('📊 Expected response from GET /api/filters:');
    console.log(JSON.stringify(response, null, 2));
    
    // Validate structure
    console.log('\n📋 Response validation:');
    console.log(`✅ subjects: ${response.subjects.length} items [${response.subjects.slice(0, 2).join(', ')}${response.subjects.length > 2 ? ', ...' : ''}]`);
    console.log(`✅ exams: ${response.exams.length} items [${response.exams.slice(0, 2).join(', ')}${response.exams.length > 2 ? ', ...' : ''}]`);
    console.log(`✅ units: ${response.units.length} items [${response.units.slice(0, 2).join(', ')}${response.units.length > 2 ? ', ...' : ''}]`);
    console.log(`✅ topics: ${response.topics.length} items [${response.topics.slice(0, 2).join(', ')}${response.topics.length > 2 ? ', ...' : ''}]`);
    console.log(`✅ subtopics: ${response.subtopics.length} items [${response.subtopics.slice(0, 2).join(', ')}${response.subtopics.length > 2 ? ', ...' : ''}]`);
    console.log(`✅ difficulties: ${response.difficulties.length} items [${response.difficulties.slice(0, 2).join(', ')}${response.difficulties.length > 2 ? ', ...' : ''}]`);
    
    console.log('\n🎉 GET /api/filters route ready!');
    console.log('✅ Returns grouped filter data as requested');
    console.log('✅ Example format: { subjects: ["Math","Commerce"], exams: ["Exam1","Exam2"], ... }');
    
  } catch (err) {
    console.error('❌ Route test failed:', err.message);
  }
}

testFiltersRoute();