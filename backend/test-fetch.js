async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    let postRes = await fetch('http://localhost:5000/api/prfs', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token 
      },
      body: JSON.stringify({
        status: 'Pending',
        layout: {},
        items: []
      })
    });
    let newPrf = await postRes.json();
    console.log('Created PRF:', newPrf.id);
    
    let payload = {
      ...newPrf,
      status: 'Approved',
      qty_0: '100'
    };
    
    let putRes = await fetch('http://localhost:5000/api/prfs/' + newPrf.id, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token 
      },
      body: JSON.stringify(payload)
    });
    console.log('Put status with extra field:', putRes.status);
    let text = await putRes.text();
    console.log('Put response:', text);
  } catch (e) {
    console.error('API Error:', e);
  }
}
test().then(() => console.log('Done'));
