const axios = require('axios');

async function testLogin() {
  console.log('🧪 Testing Login API...\n');
  
  try {
    const response = await axios.post('http://localhost:5000/api/login', {
      username: 'testuser',
      password: 'test123',
      city: 'Test City'
    });
    
    console.log('✅ Login Success:');
    console.log('Message:', response.data.message);
    console.log('Token:', response.data.token ? 'Generated' : 'Missing');
    console.log('User:', response.data.user);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server not running. Start with: npm start');
    } else {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
    }
  }
}

testLogin();