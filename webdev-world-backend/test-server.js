const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Testing Backend API...\n');
  
  try {
    // Test health check
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health Check:', health.data.message);
    
    // Test registration
    const register = await axios.post(`${BASE_URL}/api/register`, {
      fullName: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'test123'
    });
    console.log('✅ Registration:', register.data.message);
    
    // Test login
    const login = await axios.post(`${BASE_URL}/api/login`, {
      username: 'testuser',
      password: 'test123',
      city: 'Test City'
    });
    console.log('✅ Login:', login.data.message);
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running. Start with: npm start');
    } else {
      console.log('❌ Test failed:', error.response?.data?.message || error.message);
    }
  }
}

testAPI();