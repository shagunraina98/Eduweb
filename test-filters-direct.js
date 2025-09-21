const { getPool } = require('./db');

async function testFiltersDirectly() {
  let connection;
  try {
    console.log('🧪 Testing filters functionality directly with database...');
    
    const pool = getPool();
    connection = await pool.getConnection();
    
    console.log('📋 Testing distinct queries for filter data...');
    
    // Test each filter query
    const [examRows] = await connection.execute("SELECT DISTINCT `exam` FROM `questions` WHERE `exam` IS NOT NULL AND `exam` != '' ORDER BY `exam`");
    console.log('✅ Exams:', examRows.map(row => row.exam));
    
    const [subjectRows] = await connection.execute("SELECT DISTINCT `subject` FROM `questions` WHERE `subject` IS NOT NULL AND `subject` != '' ORDER BY `subject`");
    console.log('✅ Subjects:', subjectRows.map(row => row.subject));
    
    const [unitRows] = await connection.execute("SELECT DISTINCT `unit` FROM `questions` WHERE `unit` IS NOT NULL AND `unit` != '' ORDER BY `unit`");
    console.log('✅ Units:', unitRows.map(row => row.unit));
    
    const [topicRows] = await connection.execute("SELECT DISTINCT `topic` FROM `questions` WHERE `topic` IS NOT NULL AND `topic` != '' ORDER BY `topic`");
    console.log('✅ Topics:', topicRows.map(row => row.topic));
    
    const [subtopicRows] = await connection.execute("SELECT DISTINCT `subtopic` FROM `questions` WHERE `subtopic` IS NOT NULL AND `subtopic` != '' ORDER BY `subtopic`");
    console.log('✅ Subtopics:', subtopicRows.map(row => row.subtopic));
    
    const [difficultyRows] = await connection.execute("SELECT DISTINCT `difficulty` FROM `questions` WHERE `difficulty` IS NOT NULL AND `difficulty` != '' ORDER BY `difficulty`");
    console.log('✅ Difficulties:', difficultyRows.map(row => row.difficulty));
    
    // Simulate the API response
    const filterResponse = {
      exams: examRows.map(row => row.exam),
      subjects: subjectRows.map(row => row.subject),
      units: unitRows.map(row => row.unit),
      topics: topicRows.map(row => row.topic),
      subtopics: subtopicRows.map(row => row.subtopic),
      difficulties: difficultyRows.map(row => row.difficulty)
    };
    
    console.log('\n📊 Complete filter response:');
    console.log(JSON.stringify(filterResponse, null, 2));
    
    console.log('\n🎉 Filter functionality test completed!');
    console.log('✅ All filter queries execute successfully');
    console.log('✅ Data is properly formatted for frontend dropdowns');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

testFiltersDirectly();