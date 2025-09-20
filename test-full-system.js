const axios = require('axios');

async function testFullSystem() {
  try {
    console.log('🧪 Testing full system with Aiven database...');
    
    // Test admin login
    console.log('\n1. Testing admin login...');
    const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@admin.com',
      password: 'admin123'
    });
    console.log('✅ Admin login successful');
    
    // Test student login
    console.log('\n2. Testing student login...');
    const studentLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'student@test.com',
      password: 'student123'
    });
    console.log('✅ Student login successful');
    
    // Test fetching questions
    console.log('\n3. Testing questions API...');
    const questionsResponse = await axios.get('http://localhost:5000/api/questions', {
      headers: { Authorization: `Bearer ${adminLogin.data.token}` }
    });
    console.log(`✅ Found ${questionsResponse.data.length} questions`);
    questionsResponse.data.forEach(q => {
      console.log(`   - "${q.text}" (${q.options?.length || 0} options)`);
    });
    
    // Test quiz API
    console.log('\n4. Testing quiz API...');
    const quizResponse = await axios.get('http://localhost:5000/api/quiz', {
      headers: { Authorization: `Bearer ${studentLogin.data.token}` }
    });
    console.log(`✅ Quiz API returned ${quizResponse.data.length} questions`);
    
    // Test quiz submission
    console.log('\n5. Testing quiz submission...');
    const answers = {};
    quizResponse.data.forEach(q => {
      // Find the correct answer
      const correctOption = q.options.find(opt => opt.is_correct);
      if (correctOption) {
        answers[q.id] = correctOption.id;
      }
    });
    
    const submissionResponse = await axios.post('http://localhost:5000/api/quiz/submit', {
      answers: answers
    }, {
      headers: { Authorization: `Bearer ${studentLogin.data.token}` }
    });
    
    console.log('✅ Quiz submission successful');
    console.log(`   Score: ${submissionResponse.data.score}/${submissionResponse.data.totalQuestions}`);
    
    console.log('\n🎉 ALL TESTS PASSED! Aiven database integration is working perfectly!');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testFullSystem();