const http = require('http');

function makeRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers,
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function test() {
  try {
    console.log('Testing health...');
    const health = await makeRequest('GET', '/api/health');
    console.log('Health:', health.status, JSON.stringify(health.body));

    console.log('\nTesting login...');
    const login = await makeRequest('POST', '/api/auth/login', { email: 'admin@college.edu', password: 'admin123' });
    console.log('Login status:', login.status);
    if (login.status === 200) {
      console.log('Token:', login.body.token?.substring(0, 30) + '...');
      console.log('User:', login.body.user?.name, login.body.user?.role);
    } else {
      console.log('Login error:', JSON.stringify(login.body));
    }
  } catch (e) {
    console.error('Connection error:', e.message);
  }
  process.exit(0);
}

test();
