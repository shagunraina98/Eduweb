const axios = require('axios');

// Test the options update functionality
async function testOptionUpdate() {
  const baseURL = 'http://localhost:5000';
  
  try {
    // First, login as admin to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@admin.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Login successful, token received');
    
    // Get the first question to test with
    console.log('\n2. Getting first question...');
    const questionsResponse = await axios.get(`${baseURL}/api/questions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const firstQuestion = questionsResponse.data[0];
    console.log('✓ First question:', {
      id: firstQuestion.id,
      text: firstQuestion.text,
      optionsCount: firstQuestion.options?.length || 0
    });
    
    if (!firstQuestion.options || firstQuestion.options.length === 0) {
      console.log('No options found for first question');
      return;
    }
    
    // Modify the first option
    const updatedOptions = firstQuestion.options.map((opt, index) => {
      if (index === 0) {
        return {
          ...opt,
          option_text: `UPDATED: ${opt.option_text} (${new Date().toISOString()})`
        };
      }
      return opt;
    });
    
    console.log('\n3. Updating question options...');
    console.log('Original first option:', firstQuestion.options[0].option_text);
    console.log('Updated first option:', updatedOptions[0].option_text);
    
    // Make the PUT request
    const updateResponse = await axios.put(`${baseURL}/api/questions/${firstQuestion.id}`, {
      options: updatedOptions
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✓ Update response:', updateResponse.data);
    
    // Verify the update by fetching the question again
    console.log('\n4. Verifying update...');
    const verifyResponse = await axios.get(`${baseURL}/api/questions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const updatedQuestion = verifyResponse.data.find(q => q.id === firstQuestion.id);
    const firstOptionAfter = updatedQuestion?.options?.[0];
    
    console.log('First option after update:', firstOptionAfter?.option_text);
    
    if (firstOptionAfter?.option_text === updatedOptions[0].option_text) {
      console.log('✅ SUCCESS: Option was updated correctly!');
    } else {
      console.log('❌ FAILED: Option was not updated');
      console.log('Expected:', updatedOptions[0].option_text);
      console.log('Actual:', firstOptionAfter?.option_text);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testOptionUpdate();