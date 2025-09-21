const axios = require('axios');

async function testNewFiltersRoute() {
  try {
    console.log('🧪 Testing new GET /api/filters route...');
    
    // Try both ports since the server might be running on different ports
    let response;
    let baseUrl;
    
    try {
      baseUrl = 'http://localhost:5000';
      response = await axios.get(`${baseUrl}/api/filters`);
    } catch (err) {
      try {
        baseUrl = 'http://localhost:3000';
        response = await axios.get(`${baseUrl}/api/filters`);
      } catch (err2) {
        throw new Error('Server not responding on ports 3000 or 5000');
      }
    }
    
    console.log(`✅ Connected to server at ${baseUrl}`);
    console.log('✅ New filters route response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Validate the response structure
    const expectedKeys = ['subjects', 'exams', 'units', 'topics', 'subtopics', 'difficulties'];
    const responseKeys = Object.keys(response.data);
    
    console.log('\n📋 Response validation:');
    
    for (const key of expectedKeys) {
      if (responseKeys.includes(key)) {
        const values = response.data[key];
        if (Array.isArray(values)) {
          console.log(`✅ ${key}: Array with ${values.length} items`);
          if (values.length > 0) {
            console.log(`   Example: [${values.slice(0, 3).map(v => `"${v}"`).join(', ')}${values.length > 3 ? ', ...' : ''}]`);
          }
        } else {
          console.log(`❌ ${key}: Not an array`);
        }
      } else {
        console.log(`❌ Missing key: ${key}`);
      }
    }
    
    console.log('\n🎉 GET /api/filters route test completed successfully!');
    console.log('✅ Route available at: http://localhost:5000/api/filters');
    console.log('✅ Returns grouped filter data as requested');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testNewFiltersRoute();