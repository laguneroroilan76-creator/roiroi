const axios = require('axios');
async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });
    const token = loginRes.data.token;
    
    const getRes = await axios.get('http://localhost:5000/api/prfs', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const prf = getRes.data[0];
    if (!prf) { return; }
    
    const payload = {
      ...prf,
      status: 'Approved',
      layout: {},
      items: []
    };
    
    const putRes = await axios.put('http://localhost:5000/api/prfs/' + prf.id, payload, {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('Put Success!', putRes.status);
  } catch (e) {
    console.error('API Error:', e.response ? e.response.data : e.message);
  }
}
test();
