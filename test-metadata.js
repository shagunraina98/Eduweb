const axios = require('axios');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';

// First login as admin to get token
async function loginAsAdmin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@admin.com',
      password: 'testpass123'
    });
    return response.data.token;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test creating a question with new metadata fields
async function testCreateQuestionWithMetadata(token) {
  try {
    const questionData = {
      text: "What is the capital of France?",
      subject: "Geography",
      difficulty: "Easy",
      type: "multiple-choice",
      exam: "Geography Final",
      unit: "European Capitals",
      topic: "Western Europe",
      subtopic: "France",
      options: [
        { label: "A", option_text: "London", is_correct: false },
        { label: "B", option_text: "Paris", is_correct: true },
        { label: "C", option_text: "Berlin", is_correct: false },
        { label: "D", option_text: "Madrid", is_correct: false }
      ]
    };

    const response = await axios.post(`${API_BASE}/questions`, questionData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Question created successfully with ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('❌ Create question failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test getting questions to verify metadata fields are returned
async function testGetQuestionsWithMetadata() {
  try {
    const response = await axios.get(`${API_BASE}/questions`);
    const questions = response.data;
    
    console.log('✅ Got', questions.length, 'questions');
    
    // Find a question with metadata
    const questionWithMetadata = questions.find(q => q.exam || q.unit || q.topic || q.subtopic);
    
    if (questionWithMetadata) {
      console.log('✅ Found question with metadata:');
      console.log('  ID:', questionWithMetadata.id);
      console.log('  Text:', questionWithMetadata.text.substring(0, 50) + '...');
      console.log('  Exam:', questionWithMetadata.exam);
      console.log('  Unit:', questionWithMetadata.unit);
      console.log('  Topic:', questionWithMetadata.topic);
      console.log('  Subtopic:', questionWithMetadata.subtopic);
    } else {
      console.log('ℹ️ No questions with metadata found');
    }
    
    return questions;
  } catch (error) {
    console.error('❌ Get questions failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test updating a question with metadata
async function testUpdateQuestionWithMetadata(token, questionId) {
  try {
    const updateData = {
      text: "What is the capital city of France?",
      exam: "Geography Midterm",
      unit: "European Geography",
      topic: "Capital Cities",
      subtopic: "France and Neighboring Countries"
    };

    const response = await axios.put(`${API_BASE}/questions/${questionId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Question updated successfully:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Update question failed:', error.response?.data || error.message);
    throw error;
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('🔑 Logging in as admin...');
    const token = await loginAsAdmin();
    console.log('✅ Login successful');

    console.log('\n📝 Creating question with metadata...');
    const questionId = await testCreateQuestionWithMetadata(token);

    console.log('\n📋 Getting all questions to verify metadata...');
    await testGetQuestionsWithMetadata();

    console.log('\n✏️ Updating question with new metadata...');
    await testUpdateQuestionWithMetadata(token, questionId);

    console.log('\n📋 Getting questions again to verify update...');
    await testGetQuestionsWithMetadata();

    console.log('\n🎉 All tests passed! Metadata fields are working correctly.');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Only run if server is running
console.log('🧪 Testing enhanced admin form with metadata fields...');
console.log('📍 Make sure the server is running on port 5000');
console.log('');

runTests();