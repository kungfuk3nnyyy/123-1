
const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (options.cookies) {
      requestOptions.headers['Cookie'] = options.cookies;
    }

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const cookies = res.headers['set-cookie'] 
          ? res.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ')
          : null;
          
        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookies,
          data: data ? (function() {
            try { return JSON.parse(data); } catch { return data; }
          })() : null
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testLogin() {
  console.log('Testing authentication flow...');

  // Test CSRF token fetch
  console.log('\n1. Getting CSRF token...');
  const csrfResponse = await makeRequest('/api/auth/csrf');
  console.log(`CSRF Status: ${csrfResponse.status}`);
  
  if (csrfResponse.status === 200) {
    console.log('CSRF Token:', csrfResponse.data?.csrfToken);
    
    // Test credentials login
    console.log('\n2. Testing credentials login...');
    const loginResponse = await makeRequest('/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'contact@eventpro.ke',
        password: 'password123',
        csrfToken: csrfResponse.data.csrfToken,
        callbackUrl: '/organizer',
        json: 'true'
      }).toString()
    });
    
    console.log(`Login Status: ${loginResponse.status}`);
    console.log('Login Response:', loginResponse.data);
    console.log('Cookies:', loginResponse.cookies);
    
    if (loginResponse.cookies) {
      // Test protected route with session
      console.log('\n3. Testing protected API with session...');
      const protectedResponse = await makeRequest('/api/organizer/messages', {
        headers: { Cookie: loginResponse.cookies }
      });
      
      console.log(`Protected API Status: ${protectedResponse.status}`);
      console.log('Protected API Response:', protectedResponse.data);
    }
  }
}

testLogin().catch(console.error);
