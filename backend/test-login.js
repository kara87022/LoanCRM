const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:4000/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ Login test successful:', response.data);
  } catch (error) {
    console.log('❌ Login test failed:', error.response?.data || error.message);
  }
}

testLogin();