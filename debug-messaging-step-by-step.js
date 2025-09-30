
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Simplified diagnostic test
async function debugStep1_BasicAPI() {
  console.log('\n🔍 Step 1: Testing basic API accessibility');
  
  try {
    // Test basic API endpoint
    const response = await fetch('http://localhost:3000/api/auth/csrf');
    const text = await response.text();
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    console.log(`Response preview: ${text.substring(0, 100)}...`);
    
    if (text.startsWith('<!DOCTYPE')) {
      console.log('❌ Receiving HTML instead of JSON - server routing issue');
      return false;
    } else {
      console.log('✅ API is responding with JSON');
      return true;
    }
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
    return false;
  }
}

async function debugStep2_DatabaseConnection() {
  console.log('\n🔍 Step 2: Testing database connection via API');
  
  try {
    // Test an API that doesn't require auth
    const response = await fetch('http://localhost:3000/api/packages/featured');
    const text = await response.text();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response preview: ${text.substring(0, 200)}...`);
    
    if (response.status === 200 && !text.startsWith('<!DOCTYPE')) {
      console.log('✅ Database connection working');
      return true;
    } else {
      console.log('❌ Database connection or API routing issue');
      return false;
    }
  } catch (error) {
    console.log(`❌ Database test error: ${error.message}`);
    return false;
  }
}

async function debugStep3_AuthenticationFlow() {
  console.log('\n🔍 Step 3: Testing complete authentication flow');
  
  try {
    // Step 3a: Get CSRF Token
    console.log('  Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    
    if (!csrfResponse.ok) {
      console.log(`❌ CSRF fetch failed: ${csrfResponse.status}`);
      return false;
    }
    
    const csrfText = await csrfResponse.text();
    console.log(`CSRF Response: ${csrfText.substring(0, 100)}...`);
    
    let csrfData;
    try {
      csrfData = JSON.parse(csrfText);
    } catch (e) {
      console.log('❌ CSRF response is not valid JSON');
      return false;
    }
    
    const csrfToken = csrfData.csrfToken;
    console.log(`✅ CSRF token: ${csrfToken.substring(0, 20)}...`);
    
    // Step 3b: Extract cookies
    const csrfCookies = csrfResponse.headers.raw()['set-cookie'];
    if (!csrfCookies) {
      console.log('❌ No CSRF cookies received');
      return false;
    }
    
    const cookieString = csrfCookies.map(cookie => cookie.split(';')[0]).join('; ');
    console.log(`✅ CSRF cookies: ${cookieString.substring(0, 50)}...`);
    
    // Step 3c: Attempt login
    console.log('  Attempting login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieString
      },
      body: new URLSearchParams({
        email: 'sarah.photographer@example.com',
        password: 'password123',
        csrfToken: csrfToken,
        redirect: 'false'
      }),
      redirect: 'manual'
    });
    
    console.log(`Login response status: ${loginResponse.status}`);
    console.log(`Login response headers: ${JSON.stringify([...loginResponse.headers.entries()])}`);
    
    const loginCookies = loginResponse.headers.raw()['set-cookie'];
    if (loginCookies) {
      console.log(`✅ Login cookies received`);
      
      // Combine all cookies
      const allCookies = [cookieString, ...loginCookies.map(c => c.split(';')[0])].join('; ');
      
      // Step 3d: Test authenticated API call
      console.log('  Testing authenticated API call...');
      const apiResponse = await fetch('http://localhost:3000/api/talent/messages', {
        headers: { 'Cookie': allCookies }
      });
      
      console.log(`API call status: ${apiResponse.status}`);
      const apiText = await apiResponse.text();
      console.log(`API response preview: ${apiText.substring(0, 200)}...`);
      
      if (apiResponse.status === 200 && !apiText.startsWith('<!DOCTYPE')) {
        console.log('✅ Authentication flow working');
        return { success: true, cookies: allCookies };
      } else {
        console.log('❌ Authenticated API call failed');
        return { success: false, error: 'API call failed' };
      }
    } else {
      console.log('❌ No login cookies received');
      return { success: false, error: 'No cookies' };
    }
    
  } catch (error) {
    console.log(`❌ Authentication flow error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function debugStep4_MessageAPIs(cookies) {
  console.log('\n🔍 Step 4: Testing message APIs with authenticated session');
  
  const tests = [
    { name: 'Talent Messages', url: 'http://localhost:3000/api/talent/messages' },
    { name: 'Organizer Messages', url: 'http://localhost:3000/api/organizer/messages' },
    { name: 'General Messages', url: 'http://localhost:3000/api/messages' },
    { name: 'Notifications', url: 'http://localhost:3000/api/notifications' }
  ];
  
  const results = {};
  
  for (const test of tests) {
    try {
      console.log(`  Testing ${test.name}...`);
      const response = await fetch(test.url, {
        headers: { 'Cookie': cookies }
      });
      
      const text = await response.text();
      
      console.log(`    Status: ${response.status}`);
      console.log(`    Response: ${text.substring(0, 100)}...`);
      
      if (response.status === 200 && !text.startsWith('<!DOCTYPE')) {
        try {
          const data = JSON.parse(text);
          console.log(`    ✅ ${test.name}: Working - ${data.success ? 'Success' : 'API Error'}`);
          results[test.name] = { success: true, data };
        } catch (e) {
          console.log(`    ⚠️ ${test.name}: Valid response but invalid JSON`);
          results[test.name] = { success: false, error: 'Invalid JSON' };
        }
      } else {
        console.log(`    ❌ ${test.name}: Failed - Status ${response.status}`);
        results[test.name] = { success: false, error: `Status ${response.status}` };
      }
    } catch (error) {
      console.log(`    ❌ ${test.name}: Error - ${error.message}`);
      results[test.name] = { success: false, error: error.message };
    }
  }
  
  return results;
}

async function debugStep5_SSEConnection(cookies) {
  console.log('\n🔍 Step 5: Testing Server-Sent Events connection');
  
  return new Promise((resolve) => {
    try {
      // Try to require EventSource
      let EventSource;
      try {
        EventSource = require('eventsource');
      } catch (e) {
        console.log('❌ EventSource module not found');
        resolve({ success: false, error: 'EventSource not available' });
        return;
      }
      
      console.log('✅ EventSource module loaded');
      
      const eventSource = new EventSource('http://localhost:3000/api/websocket', {
        headers: { 'Cookie': cookies }
      });
      
      let connected = false;
      let messagesReceived = [];
      
      const timeout = setTimeout(() => {
        eventSource.close();
        console.log(`Connection result: ${connected ? 'Connected' : 'Failed to connect'}`);
        console.log(`Messages received: ${messagesReceived.length}`);
        resolve({ 
          success: connected, 
          messagesReceived,
          error: connected ? null : 'Connection timeout'
        });
      }, 3000);
      
      eventSource.onopen = () => {
        console.log('✅ SSE connection opened');
        connected = true;
      };
      
      eventSource.onmessage = (event) => {
        console.log(`📨 SSE message: ${event.data.substring(0, 100)}...`);
        messagesReceived.push(event.data);
      };
      
      eventSource.onerror = (error) => {
        console.log(`❌ SSE error: ${error}`);
        eventSource.close();
        clearTimeout(timeout);
        resolve({ success: false, error: 'Connection error' });
      };
      
    } catch (error) {
      console.log(`❌ SSE test error: ${error.message}`);
      resolve({ success: false, error: error.message });
    }
  });
}

// Main debug function
async function runDebugDiagnostics() {
  console.log('🔧 DEBUGGING REAL-TIME MESSAGING SYSTEM');
  console.log('==========================================\n');
  
  // Step 1: Basic API
  const step1 = await debugStep1_BasicAPI();
  if (!step1) {
    console.log('\n❌ CRITICAL: Basic API access failed. Check server status.');
    return;
  }
  
  // Step 2: Database
  const step2 = await debugStep2_DatabaseConnection();
  if (!step2) {
    console.log('\n❌ CRITICAL: Database connection failed. Check database and schema.');
    return;
  }
  
  // Step 3: Authentication
  const step3 = await debugStep3_AuthenticationFlow();
  if (!step3.success) {
    console.log('\n❌ CRITICAL: Authentication failed. Check credentials and auth flow.');
    return;
  }
  
  console.log('\n✅ Authentication successful! Proceeding with authenticated tests...');
  
  // Step 4: Message APIs
  const step4 = await debugStep4_MessageAPIs(step3.cookies);
  
  // Step 5: SSE Connection
  const step5 = await debugStep5_SSEConnection(step3.cookies);
  
  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('====================');
  console.log(`✅ Basic API: Working`);
  console.log(`✅ Database: Working`);
  console.log(`✅ Authentication: Working`);
  
  Object.entries(step4).forEach(([name, result]) => {
    console.log(`${result.success ? '✅' : '❌'} ${name}: ${result.success ? 'Working' : result.error}`);
  });
  
  console.log(`${step5.success ? '✅' : '❌'} SSE Connection: ${step5.success ? 'Working' : step5.error}`);
  
  // Next steps
  if (Object.values(step4).some(r => !r.success) || !step5.success) {
    console.log('\n🔧 ISSUES FOUND - Recommendations:');
    
    Object.entries(step4).forEach(([name, result]) => {
      if (!result.success) {
        console.log(`- Fix ${name} API endpoint`);
      }
    });
    
    if (!step5.success) {
      console.log('- Fix SSE connection issues');
    }
  } else {
    console.log('\n🎉 All core components working! Ready for integration testing.');
  }
}

// Run diagnostics
runDebugDiagnostics().catch(console.error);
