const axios = require('axios');

async function quickTest() {
  try {
    console.log('🧪 Quick test of Aiven database connection...');
    
    // Test admin login
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@admin.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful:', {
      user: response.data.user,
      tokenExists: !!response.data.token
    });
    
    // Test questions API
    const questionsResponse = await axios.get('http://localhost:5000/api/questions', {
      headers: { Authorization: `Bearer ${response.data.token}` }
    });
    
    console.log(`✅ Questions API: Found ${questionsResponse.data.length} questions`);
    
    console.log('\n🎉 Aiven database is working perfectly!');
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

quickTest();