const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testFiltersEndpoint() {
  try {
    console.log('🧪 Testing GET /api/filters endpoint...');
    
    const response = await axios.get(`${API_BASE}/filters`);
    
    console.log('✅ Filters endpoint response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Validate the response structure
    const expectedKeys = ['exams', 'subjects', 'units', 'topics', 'subtopics', 'difficulties', 'types'];
    const responseKeys = Object.keys(response.data);
    
    console.log('\n📋 Response validation:');
    
    for (const key of expectedKeys) {
      if (responseKeys.includes(key)) {
        const values = response.data[key];
        if (Array.isArray(values)) {
          console.log(`✅ ${key}: Array with ${values.length} items`);
          if (values.length > 0) {
            console.log(`   Example values: ${values.slice(0, 3).join(', ')}${values.length > 3 ? '...' : ''}`);
          }
        } else {
          console.log(`❌ ${key}: Not an array`);
        }
      } else {
        console.log(`❌ Missing key: ${key}`);
      }
    }
    
    console.log('\n🎉 Filters endpoint test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Test if we can create some sample data first
async function createSampleData() {
  try {
    console.log('📝 Creating sample data for filter testing...');
    
    // You would need an admin token for this - skipping for now
    // This is just to show what sample data would look like
    const sampleQuestions = [
      {
        text: "What is the capital of France?",
        subject: "Geography",
        difficulty: "Easy",
        type: "multiple-choice",
        exam: "Geography Final",
        unit: "European Capitals",
        topic: "Western Europe",
        subtopic: "France"
      },
      {
        text: "What is 2 + 2?",
        subject: "Mathematics",
        difficulty: "Easy", 
        type: "multiple-choice",
        exam: "Math Midterm",
        unit: "Arithmetic",
        topic: "Addition",
        subtopic: "Basic Addition"
      }
    ];
    
    console.log('📋 Sample data that would create these filters:');
    sampleQuestions.forEach((q, idx) => {
      console.log(`\n${idx + 1}. ${q.text}`);
      console.log(`   Exam: ${q.exam}`);
      console.log(`   Subject: ${q.subject}`);
      console.log(`   Unit: ${q.unit}`);
      console.log(`   Topic: ${q.topic}`);
      console.log(`   Subtopic: ${q.subtopic}`);
      console.log(`   Difficulty: ${q.difficulty}`);
    });
    
  } catch (error) {
    console.error('❌ Sample data creation failed:', error.message);
  }
}

async function runTest() {
  await createSampleData();
  await testFiltersEndpoint();
}

runTest();