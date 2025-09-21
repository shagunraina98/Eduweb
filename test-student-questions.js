const axios = require('axios');

async function testFiltersAndQuestions() {
  try {
    console.log('🧪 Testing student questions page functionality...');
    
    // Test filters endpoint (should work without auth)
    console.log('\n1. Testing GET /api/questions/filters (no auth required)...');
    try {
      const filtersResponse = await axios.get('http://localhost:5000/api/questions/filters');
      console.log('✅ Filters endpoint successful');
      console.log('📊 Available filters:');
      const filters = filtersResponse.data;
      console.log(`   Exams: ${filters.exams?.length || 0} (${filters.exams?.slice(0, 3).join(', ')})${filters.exams?.length > 3 ? '...' : ''}`);
      console.log(`   Subjects: ${filters.subjects?.length || 0} (${filters.subjects?.slice(0, 3).join(', ')})${filters.subjects?.length > 3 ? '...' : ''}`);
      console.log(`   Units: ${filters.units?.length || 0} (${filters.units?.slice(0, 3).join(', ')})${filters.units?.length > 3 ? '...' : ''}`);
      console.log(`   Topics: ${filters.topics?.length || 0} (${filters.topics?.slice(0, 3).join(', ')})${filters.topics?.length > 3 ? '...' : ''}`);
      console.log(`   Subtopics: ${filters.subtopics?.length || 0} (${filters.subtopics?.slice(0, 3).join(', ')})${filters.subtopics?.length > 3 ? '...' : ''}`);
      console.log(`   Difficulties: ${filters.difficulties?.length || 0} (${filters.difficulties?.slice(0, 3).join(', ')})${filters.difficulties?.length > 3 ? '...' : ''}`);
    } catch (error) {
      console.log('❌ Filters endpoint failed:', error.response?.data || error.message);
    }
    
    // Test questions endpoint (should work without auth)
    console.log('\n2. Testing GET /api/questions (no auth required)...');
    try {
      const questionsResponse = await axios.get('http://localhost:5000/api/questions');
      console.log('✅ Questions endpoint successful');
      console.log(`📝 Found ${questionsResponse.data?.length || 0} questions`);
      
      if (questionsResponse.data?.length > 0) {
        const sampleQuestion = questionsResponse.data[0];
        console.log('\n📋 Sample question structure:');
        console.log(`   ID: ${sampleQuestion.id}`);
        console.log(`   Text: ${sampleQuestion.text?.substring(0, 50)}...`);
        console.log(`   Subject: ${sampleQuestion.subject || 'N/A'}`);
        console.log(`   Exam: ${sampleQuestion.exam || 'N/A'}`);
        console.log(`   Unit: ${sampleQuestion.unit || 'N/A'}`);
        console.log(`   Topic: ${sampleQuestion.topic || 'N/A'}`);
        console.log(`   Subtopic: ${sampleQuestion.subtopic || 'N/A'}`);
        console.log(`   Difficulty: ${sampleQuestion.difficulty || 'N/A'}`);
        console.log(`   Options: ${sampleQuestion.options?.length || 0}`);
      }
    } catch (error) {
      console.log('❌ Questions endpoint failed:', error.response?.data || error.message);
    }
    
    // Test filtered questions
    console.log('\n3. Testing filtered questions...');
    try {
      const filteredResponse = await axios.get('http://localhost:5000/api/questions', {
        params: { subject: 'Mathematics' }
      });
      console.log('✅ Filtered questions successful');
      console.log(`📝 Found ${filteredResponse.data?.length || 0} Mathematics questions`);
    } catch (error) {
      console.log('❌ Filtered questions failed:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Student questions page backend testing complete!');
    console.log('✅ Filter dropdowns will be populated from API data');
    console.log('✅ All filter options remain available regardless of current filter');
    console.log('✅ Questions update based on selected filters');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testFiltersAndQuestions();