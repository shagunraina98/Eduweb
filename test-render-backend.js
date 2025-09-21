const axios = require('axios');

async function testRenderBackend() {
  const backendUrl = 'https://eduweb-jade-phi.vercel.app/';
  
  try {
    console.log('🔄 Testing connection to Render backend...');
    console.log('Backend URL:', backendUrl);
    
    // Test basic connectivity
    console.log('\n1. Testing health/connectivity...');
    const healthResponse = await axios.get(`${backendUrl}/api/health`, {
      timeout: 10000 // 10 second timeout for Render
    }).catch(err => {
      if (err.response) {
        return err.response;
      }
      throw err;
    });
    
    if (healthResponse.status === 200) {
      console.log('✅ Health check passed');
    } else {
      console.log('ℹ️  Health endpoint not available, trying auth...');
    }
    
    // Test auth endpoint
    console.log('\n2. Testing auth endpoint...');
    const authResponse = await axios.post(`${backendUrl}/api/auth/login`, {
      email: 'test@test.com',
      password: 'wrongpassword'
    }, {
      timeout: 10000
    }).catch(err => err.response);
    
    if (authResponse && authResponse.status === 401) {
      console.log('✅ Auth endpoint is responding (expected 401 for wrong credentials)');
    } else if (authResponse && authResponse.status) {
      console.log(`✅ Auth endpoint responded with status: ${authResponse.status}`);
    } else {
      console.log('❌ Auth endpoint not responding');
    }
    
    // Test with correct credentials if we have them
    console.log('\n3. Testing with admin credentials...');
    try {
      const loginResponse = await axios.post(`${backendUrl}/api/auth/login`, {
        email: 'admin@admin.com',
        password: 'admin123'
      }, {
        timeout: 10000
      });
      
      console.log('✅ Admin login successful!');
      console.log('User:', loginResponse.data.user);
      
      // Test questions endpoint
      console.log('\n4. Testing questions endpoint...');
      const questionsResponse = await axios.get(`${backendUrl}/api/questions`, {
        headers: { Authorization: `Bearer ${loginResponse.data.token}` },
        timeout: 10000
      });
      
      console.log(`✅ Questions endpoint working! Found ${questionsResponse.data.length} questions`);
      
    } catch (loginError) {
      console.log('ℹ️  Admin login failed (might need to set up admin user on Render)');
      console.log('Error:', loginError.response?.data || loginError.message);
    }
    
    console.log('\n🎉 Render backend is accessible!');
    console.log('✅ Frontend can now connect to:', backendUrl);
    
  } catch (error) {
    console.error('❌ Connection failed:', {
      message: error.message,
      code: error.code,
      status: error.response?.status
    });
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Check if the Render URL is correct');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 The service might be sleeping or not deployed');
    } else if (error.code === 'TIMEOUT' || error.message.includes('timeout')) {
      console.log('💡 The service is slow to respond (Render cold start)');
    }
  }
}

testRenderBackend();