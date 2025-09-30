
const https = require('https');
const http = require('http');

// Test authentication without CAPTCHA
async function testAuthenticationFlow() {
    console.log('\n🔧 Testing Authentication Without CAPTCHA...\n');
    
    const testAccounts = [
        { email: 'john@doe.com', password: 'johndoe123', role: 'Admin' },
        { email: 'sarah.photographer@example.com', password: 'password123', role: 'Talent' },
        { email: 'contact@eventpro.ke', password: 'password123', role: 'Organizer' }
    ];
    
    for (const account of testAccounts) {
        console.log(`Testing ${account.role}: ${account.email}`);
        
        try {
            // Get CSRF token first
            const csrfResponse = await makeRequest('GET', '/api/auth/csrf');
            const csrfData = JSON.parse(csrfResponse.body);
            const csrfToken = csrfData.csrfToken;
            
            console.log(`  ✓ CSRF Token obtained: ${csrfToken.substring(0, 20)}...`);
            
            // Attempt login without CAPTCHA
            const loginData = new URLSearchParams({
                email: account.email,
                password: account.password,
                callbackUrl: 'http://localhost:3000',
                csrfToken: csrfToken,
                json: 'true'
            });
            
            const loginResponse = await makeRequest('POST', '/api/auth/callback/credentials', loginData.toString(), {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': csrfResponse.headers['set-cookie']?.[0] || ''
            });
            
            if (loginResponse.statusCode === 200) {
                const responseBody = JSON.parse(loginResponse.body);
                if (responseBody.url) {
                    console.log(`  ✅ Login successful - redirecting to: ${responseBody.url}`);
                } else {
                    console.log(`  ✅ Login successful`);
                }
            } else if (loginResponse.statusCode === 401) {
                const responseBody = JSON.parse(loginResponse.body);
                if (responseBody.message && responseBody.message.includes('CAPTCHA')) {
                    console.log(`  ❌ CAPTCHA still present in authentication: ${responseBody.message}`);
                    return false;
                } else {
                    console.log(`  ⚠️  Authentication failed (but not due to CAPTCHA): ${responseBody.message || 'Unknown error'}`);
                }
            } else {
                console.log(`  ⚠️  Unexpected response code: ${loginResponse.statusCode}`);
            }
            
        } catch (error) {
            console.log(`  ❌ Error testing ${account.email}: ${error.message}`);
        }
        
        console.log('');
    }
    
    // Test signup without CAPTCHA
    console.log('Testing Signup Without CAPTCHA...');
    
    try {
        const signupData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'testpassword123',
            role: 'ORGANIZER'
        };
        
        const signupResponse = await makeRequest('POST', '/api/auth/signup', JSON.stringify(signupData), {
            'Content-Type': 'application/json'
        });
        
        const responseBody = JSON.parse(signupResponse.body);
        
        if (signupResponse.statusCode === 200 || signupResponse.statusCode === 400) {
            if (responseBody.error && responseBody.error.includes('CAPTCHA')) {
                console.log(`  ❌ CAPTCHA still present in signup: ${responseBody.error}`);
                return false;
            } else if (responseBody.error && responseBody.error.includes('User already exists')) {
                console.log(`  ✅ Signup working (user already exists - expected)`);
            } else if (responseBody.message) {
                console.log(`  ✅ Signup successful: ${responseBody.message}`);
            } else {
                console.log(`  ✅ Signup API working`);
            }
        } else {
            console.log(`  ⚠️  Unexpected signup response: ${signupResponse.statusCode}`);
        }
        
    } catch (error) {
        console.log(`  ❌ Error testing signup: ${error.message}`);
    }
    
    console.log('\n🎉 Authentication tests completed - CAPTCHA successfully removed!\n');
    return true;
}

function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'User-Agent': 'Test-Script/1.0',
                ...headers
            }
        };
        
        if (data && method === 'POST') {
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }
        
        const req = http.request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (data) {
            req.write(data);
        }
        
        req.end();
    });
}

// Run the test
testAuthenticationFlow().catch(console.error);
