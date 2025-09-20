const axios = require('axios');

async function fixMathQuestion() {
  try {
    // Login as admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@admin.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Logged in as admin');
    
    // Get questions to find the math question
    const questionsResponse = await axios.get('http://localhost:5000/api/questions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const mathQuestion = questionsResponse.data.find(q => q.text.includes('3+8'));
    if (!mathQuestion) {
      console.log('Math question not found');
      return;
    }
    
    console.log('Found question:', mathQuestion.id, mathQuestion.text);
    
    // Update with correct options
    const updatedOptions = [
      {
        id: mathQuestion.options[0]?.id, // Keep existing ID if available
        label: 'A',
        option_text: '10',
        is_correct: false
      },
      {
        id: mathQuestion.options[1]?.id,
        label: 'B', 
        option_text: '11',
        is_correct: true  // This is the correct answer
      },
      {
        id: mathQuestion.options[2]?.id,
        label: 'C',
        option_text: '12', 
        is_correct: false
      }
    ];
    
    console.log('Updating options to:', updatedOptions);
    
    const updateResponse = await axios.put(`http://localhost:5000/api/questions/${mathQuestion.id}`, {
      options: updatedOptions
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Update successful:', updateResponse.data);
    
    // Verify the fix
    const verifyResponse = await axios.get('http://localhost:5000/api/questions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const fixedQuestion = verifyResponse.data.find(q => q.id === mathQuestion.id);
    console.log('\n✅ Fixed question options:');
    fixedQuestion.options.forEach(opt => {
      console.log(`${opt.label}: ${opt.option_text} ${opt.is_correct ? '(correct)' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

fixMathQuestion();