const axios = require('axios');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';

async function testLogin(email, password, description) {
  try {
    console.log(`\n🔑 Testing login: ${description}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password ? '***' : 'undefined'}`);
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    });
    
    console.log('✅ Login successful!');
    console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
    return response.data.token;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.error || error.message);
    return null;
  }
}

async function runLoginTests() {
  console.log('🧪 Testing different login combinations...');
  
  // Test with env values
  await testLogin(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD, 'ENV values');
  
  // Test with database email and env password
  await testLogin('admin@admin.com', process.env.ADMIN_PASSWORD, 'DB email + ENV password');
  
  // Test with common admin passwords
  await testLogin('admin@admin.com', 'admin', 'DB email + "admin"');
  await testLogin('admin@admin.com', 'password', 'DB email + "password"');
  await testLogin('admin@admin.com', 'admin123', 'DB email + "admin123"');
}

runLoginTests();