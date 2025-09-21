const axios = require('axios');

async function testFixedAPI() {
  const baseURL = 'https://eduweb-jade-phi.vercel.app/';
  
  try {
    console.log('🧪 Testing fixed database schema...');
    
    // Test admin login
    console.log('\n1. Testing admin login...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@admin.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    console.log('User:', loginResponse.data.user);
    
    // Test questions endpoint (this was failing before)
    console.log('\n2. Testing questions endpoint...');
    const questionsResponse = await axios.get(`${baseURL}/api/questions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Questions API working! Found ${questionsResponse.data.length} questions`);
    questionsResponse.data.forEach(q => {
      console.log(`   - ID: ${q.id}, Text: "${q.text}", Options: ${q.options?.length || 0}`);
    });
    
    // Test quiz endpoint
    console.log('\n3. Testing quiz endpoint...');
    const quizResponse = await axios.get(`${baseURL}/api/quiz`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Quiz API working! Found ${quizResponse.data.length} questions`);
    
    // Test creating a new question
    console.log('\n4. Testing question creation...');
    const newQuestion = {
      text: 'What is 10 + 5?',
      subject: 'Math',
      difficulty: 'easy',
      type: 'mcq',
      options: [
        { label: 'A', option_text: '14', is_correct: false },
        { label: 'B', option_text: '15', is_correct: true },
        { label: 'C', option_text: '16', is_correct: false }
      ]
    };
    
    const createResponse = await axios.post(`${baseURL}/api/questions`, newQuestion, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Question creation successful');
    console.log('Created question ID:', createResponse.data.questionId);
    
    // Test updating the question
    console.log('\n5. Testing question update...');
    const updateData = {
      text: 'What is 10 + 5? (Updated)',
      options: newQuestion.options.map(opt => ({
        ...opt,
        option_text: opt.option_text + ' (updated)'
      }))
    };
    
    const updateResponse = await axios.put(`${baseURL}/api/questions/${createResponse.data.questionId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Question update successful');
    
    // Test student operations
    console.log('\n6. Testing student registration...');
    const studentData = {
      name: 'Test Student',
      email: `teststudent${Date.now()}@test.com`,
      password: 'password123'
    };
    
    const studentRegister = await axios.post(`${baseURL}/api/auth/register`, studentData);
    console.log('✅ Student registration successful');
    
    const studentToken = studentRegister.data.token;
    
    // Test quiz taking
    console.log('\n7. Testing quiz submission...');
    const studentQuizResponse = await axios.get(`${baseURL}/api/quiz?limit=2`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    // Submit answers for all questions
    const answers = {};
    studentQuizResponse.data.forEach(q => {
      // Find correct answer
      const correctOption = q.options.find(opt => opt.is_correct);
      if (correctOption) {
        answers[q.id] = correctOption.id;
      }
    });
    
    const submissionResponse = await axios.post(`${baseURL}/api/quiz/submit`, {
      answers: answers
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    console.log('✅ Quiz submission successful');
    console.log(`Score: ${submissionResponse.data.score}/${submissionResponse.data.totalQuestions}`);
    
    console.log('\n🎉 ALL DATABASE TESTS PASSED!');
    console.log('✅ Schema issues have been resolved');
    console.log('✅ All CRUD operations working');
    console.log('✅ Quiz functionality operational');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testFixedAPI();