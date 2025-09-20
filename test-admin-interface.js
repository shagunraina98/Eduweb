const axios = require('axios');

async function testAdminInterfaceUpdate() {
  try {
    // Login as admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@admin.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Logged in as admin');
    
    // Get a question to edit
    const questionsResponse = await axios.get('http://localhost:5000/api/questions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const targetQuestion = questionsResponse.data.find(q => q.id === 14); // "What is 2+7?"
    if (!targetQuestion) {
      console.log('Target question not found');
      return;
    }
    
    console.log('\n📝 Original question:', {
      id: targetQuestion.id,
      text: targetQuestion.text,
      options: targetQuestion.options
    });
    
    // Simulate what the admin interface would send when updating options
    const updatedOptions = targetQuestion.options.map(opt => {
      if (opt.label === 'A') {
        return {
          id: opt.id,
          label: opt.label,
          option_text: '9', // Change from '2' to '9'
          is_correct: true // Make this the correct answer instead of B
        };
      } else if (opt.label === 'B') {
        return {
          id: opt.id,
          label: opt.label,
          option_text: opt.option_text, // Keep '10'
          is_correct: false // Remove correct flag
        };
      }
      return opt;
    });
    
    const updatePayload = {
      text: targetQuestion.text,
      subject: targetQuestion.subject,
      difficulty: targetQuestion.difficulty,
      type: targetQuestion.type,
      options: updatedOptions
    };
    
    console.log('\n🔄 Sending update with payload:', JSON.stringify(updatePayload, null, 2));
    
    const updateResponse = await axios.put(`http://localhost:5000/api/questions/${targetQuestion.id}`, updatePayload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✓ Update response:', updateResponse.data);
    
    // Wait and verify
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const verifyResponse = await axios.get('http://localhost:5000/api/questions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const updatedQuestion = verifyResponse.data.find(q => q.id === targetQuestion.id);
    
    console.log('\n✅ Updated question:', {
      id: updatedQuestion.id,
      text: updatedQuestion.text,
      options: updatedQuestion.options
    });
    
    // Check if our changes took effect
    const optionA = updatedQuestion.options.find(opt => opt.label === 'A');
    const optionB = updatedQuestion.options.find(opt => opt.label === 'B');
    
    if (optionA?.option_text === '9' && optionA.is_correct && !optionB?.is_correct) {
      console.log('\n🎉 SUCCESS: Admin interface update simulation worked perfectly!');
      console.log('- Option A changed to "9" and marked as correct ✓');
      console.log('- Option B is no longer marked as correct ✓');
    } else {
      console.log('\n❌ FAILED: Changes did not persist correctly');
      console.log('Expected: A="9" (correct), B="10" (incorrect)');
      console.log('Actual: A="' + optionA?.option_text + '" (' + (optionA?.is_correct ? 'correct' : 'incorrect') + '), B="' + optionB?.option_text + '" (' + (optionB?.is_correct ? 'correct' : 'incorrect') + ')');
    }
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testAdminInterfaceUpdate();