const http = require('http');

console.log('Testing /api/filters endpoint...');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/filters',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('\n✅ Success! Response data:');
      console.log(JSON.stringify(parsed, null, 2));
      
      // Validate structure
      const expectedKeys = ['exams', 'subjects', 'units', 'topics', 'subtopics', 'difficulties', 'types'];
      console.log('\n📋 Validation:');
      expectedKeys.forEach(key => {
        if (parsed[key] && Array.isArray(parsed[key])) {
          console.log(`✅ ${key}: ${parsed[key].length} items`);
        } else {
          console.log(`❌ ${key}: Missing or not array`);
        }
      });
      
    } catch (err) {
      console.log('Raw response:', data);
      console.error('JSON Parse Error:', err.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.on('timeout', () => {
  console.error('❌ Request timed out');
  req.destroy();
});

req.setTimeout(5000);
req.end();