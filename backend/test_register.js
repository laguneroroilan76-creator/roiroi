async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin', password: 'Password!123' })
    });
    const loginData = await loginRes.json();
    console.log('Login successful. Token:', loginData.token.substring(0, 10) + '...');
    
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({ email: 'test999@test.com', password: 'Password!123', name: 'Test', role: 'User' })
    });
    const regData = await regRes.json();
    console.log('Register response:', regRes.status, regData);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
