const axios = require('axios');

async function debugAllQuestions() {
  try {
    // Login as admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@admin.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Logged in as admin');
    
    // Get all questions
    const questionsResponse = await axios.get('http://localhost:5000/api/questions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n📋 All questions in database:');
    questionsResponse.data.forEach((q, index) => {
      console.log(`\n${index + 1}. Question ID ${q.id}: "${q.text}"`);
      console.log(`   Subject: ${q.subject}, Difficulty: ${q.difficulty}, Type: ${q.type}`);
      if (q.options && q.options.length > 0) {
        q.options.forEach(opt => {
          console.log(`   ${opt.label}: ${opt.option_text} ${opt.is_correct ? '(correct)' : ''}`);
        });
      } else {
        console.log('   ❌ No options found');
      }
    });
    
    // Test updating a different question (not the math one)
    const testQuestion = questionsResponse.data.find(q => q.id !== 3 && q.options && q.options.length > 0);
    
    if (testQuestion) {
      console.log(`\n🧪 Testing update on Question ID ${testQuestion.id}: "${testQuestion.text}"`);
      
      // Modify the first option text
      const updatedOptions = testQuestion.options.map((opt, index) => {
        if (index === 0) {
          return {
            ...opt,
            option_text: `TEST UPDATE: ${opt.option_text} (${new Date().toISOString().slice(11, 19)})`
          };
        }
        return opt;
      });
      
      console.log('Original first option:', testQuestion.options[0].option_text);
      console.log('Updated first option:', updatedOptions[0].option_text);
      
      const updateResponse = await axios.put(`http://localhost:5000/api/questions/${testQuestion.id}`, {
        options: updatedOptions
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✓ Update response:', updateResponse.data);
      
      // Wait a moment then verify
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const verifyResponse = await axios.get('http://localhost:5000/api/questions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const verifiedQuestion = verifyResponse.data.find(q => q.id === testQuestion.id);
      const verifiedFirstOption = verifiedQuestion?.options?.[0];
      
      console.log('\n🔍 Verification:');
      console.log('Expected:', updatedOptions[0].option_text);
      console.log('Actual:', verifiedFirstOption?.option_text);
      
      if (verifiedFirstOption?.option_text === updatedOptions[0].option_text) {
        console.log('✅ SUCCESS: Option update worked correctly!');
      } else {
        console.log('❌ FAILED: Option was not updated properly');
        
        // Additional debugging - check if IDs match
        console.log('\n🔍 Debug info:');
        console.log('Original option ID:', testQuestion.options[0].id);
        console.log('Updated option ID:', updatedOptions[0].id);
        console.log('Verified option ID:', verifiedFirstOption?.id);
        console.log('All verified options:');
        verifiedQuestion?.options?.forEach(opt => {
          console.log(`  ID ${opt.id}: ${opt.option_text}`);
        });
      }
    } else {
      console.log('\n❌ No suitable question found for testing');
    }
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

debugAllQuestions();