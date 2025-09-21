const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testQuizStartEndpoint() {
  console.log('🧪 Testing GET /api/quiz/start endpoint...\n');

  try {
    // Test 1: Get all questions and filters (no parameters)
    console.log('1️⃣ Testing: GET /api/quiz/start (no filters)');
    const response1 = await axios.get(`${BASE_URL}/api/quiz/start`);
    console.log('✅ Status:', response1.status);
    console.log('📝 Response structure:', {
      hasQuestions: Array.isArray(response1.data.questions),
      questionCount: response1.data.questions?.length || 0,
      hasFilters: !!response1.data.filters,
      filterKeys: Object.keys(response1.data.filters || {})
    });
    
    if (response1.data.questions?.length > 0) {
      console.log('📋 Sample question:', {
        id: response1.data.questions[0].id,
        text: response1.data.questions[0].text?.substring(0, 50) + '...',
        hasOptions: Array.isArray(response1.data.questions[0].options),
        optionCount: response1.data.questions[0].options?.length || 0
      });
    }
    
    console.log('🏷️ Available filters:', {
      exam: response1.data.filters?.exam?.length || 0,
      subject: response1.data.filters?.subject?.length || 0,
      unit: response1.data.filters?.unit?.length || 0,
      topic: response1.data.filters?.topic?.length || 0,
      subtopic: response1.data.filters?.subtopic?.length || 0,
      difficulty: response1.data.filters?.difficulty?.length || 0
    });
    console.log('\n');

    // Test 2: Test with filters
    if (response1.data.filters?.subject?.length > 0) {
      const testSubject = response1.data.filters.subject[0];
      console.log(`2️⃣ Testing: GET /api/quiz/start?subject=${testSubject}&limit=5`);
      const response2 = await axios.get(`${BASE_URL}/api/quiz/start?subject=${encodeURIComponent(testSubject)}&limit=5`);
      console.log('✅ Status:', response2.status);
      console.log('📝 Filtered results:', {
        questionCount: response2.data.questions?.length || 0,
        allMatchSubject: response2.data.questions?.every(q => q.subject === testSubject) || false
      });
      console.log('\n');
    }

    // Test 3: Test with difficulty filter
    if (response1.data.filters?.difficulty?.length > 0) {
      const testDifficulty = response1.data.filters.difficulty[0];
      console.log(`3️⃣ Testing: GET /api/quiz/start?difficulty=${testDifficulty}&limit=3`);
      const response3 = await axios.get(`${BASE_URL}/api/quiz/start?difficulty=${encodeURIComponent(testDifficulty)}&limit=3`);
      console.log('✅ Status:', response3.status);
      console.log('📝 Difficulty filtered results:', {
        questionCount: response3.data.questions?.length || 0,
        allMatchDifficulty: response3.data.questions?.every(q => q.difficulty === testDifficulty) || false
      });
      console.log('\n');
    }

    // Test 4: Test with impossible filter combination
    console.log('4️⃣ Testing: GET /api/quiz/start?subject=NonexistentSubject');
    const response4 = await axios.get(`${BASE_URL}/api/quiz/start?subject=NonexistentSubject`);
    console.log('✅ Status:', response4.status);
    console.log('📝 No matches result:', {
      questionCount: response4.data.questions?.length || 0,
      stillHasFilters: !!response4.data.filters && Object.keys(response4.data.filters).length > 0
    });
    console.log('\n');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Headers:', error.response.headers);
    }
  }
}

// Run the test
testQuizStartEndpoint();