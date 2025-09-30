
const https = require('http');
const fs = require('fs');

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testTalentMessagesPage() {
  console.log('🔧 Testing Talent Messages page after fix...');
  
  try {
    // Step 1: Login to get session
    console.log('🔐 Logging in...');
    const loginData = JSON.stringify({
      email: 'john@doe.com',
      password: 'johndoe123'
    });
    
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/callback/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, loginData);
    
    console.log(`Login status: ${loginResponse.status}`);
    
    // Extract session cookie
    const setCookieHeader = loginResponse.headers['set-cookie'];
    let sessionCookie = '';
    if (setCookieHeader) {
      sessionCookie = setCookieHeader.map(cookie => cookie.split(';')[0]).join('; ');
      console.log('📄 Session cookie obtained');
    }
    
    // Step 2: Test the talent messages API directly
    console.log('📨 Testing talent messages API...');
    const messagesResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/talent/messages',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log(`Messages API status: ${messagesResponse.status}`);
    
    if (messagesResponse.status === 200) {
      try {
        const data = JSON.parse(messagesResponse.body);
        console.log('✅ Messages API response structure:');
        console.log(`  - Success: ${data.success}`);
        console.log(`  - Data type: ${Array.isArray(data.data) ? 'Array' : typeof data.data}`);
        console.log(`  - Data length: ${data.data?.length ?? 'N/A'}`);
        
        if (data.data && Array.isArray(data.data)) {
          console.log('✅ API returns conversations array as expected');
          if (data.data.length > 0) {
            const firstConversation = data.data[0];
            console.log('  - First conversation structure:');
            console.log(`    - bookingId: ${firstConversation?.bookingId ?? 'missing'}`);
            console.log(`    - eventTitle: ${firstConversation?.eventTitle ?? 'missing'}`);
            console.log(`    - organizerName: ${firstConversation?.organizerName ?? 'missing'}`);
            console.log(`    - lastMessage: ${firstConversation?.lastMessage ? 'present' : 'missing'}`);
          } else {
            console.log('  - No conversations found (empty array)');
          }
        } else {
          console.log('❌ API does not return expected array structure');
        }
      } catch (parseError) {
        console.log('❌ Failed to parse API response:', parseError.message);
        console.log('Response body:', messagesResponse.body.substring(0, 200));
      }
    } else {
      console.log('❌ Messages API failed');
      console.log('Response body:', messagesResponse.body.substring(0, 200));
    }
    
    // Step 3: Test the messages page HTML
    console.log('🌐 Testing talent messages page HTML...');
    const pageResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/talent/messages',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log(`Messages page status: ${pageResponse.status}`);
    
    if (pageResponse.status === 200) {
      console.log('✅ Messages page loads successfully');
      // Check if the page contains expected elements
      const pageContent = pageResponse.body;
      const hasMessagesTitle = pageContent.includes('Messages');
      const hasConversationsSection = pageContent.includes('Conversations');
      const hasNoErrorsInHTML = !pageContent.includes('Cannot read properties of undefined');
      
      console.log(`  - Contains Messages title: ${hasMessagesTitle}`);
      console.log(`  - Contains Conversations section: ${hasConversationsSection}`);
      console.log(`  - No undefined errors in HTML: ${hasNoErrorsInHTML}`);
      
      if (hasMessagesTitle && hasConversationsSection && hasNoErrorsInHTML) {
        console.log('🎉 SUCCESS: Talent Messages page appears to be working correctly!');
      }
    } else if (pageResponse.status === 307) {
      console.log('🔄 Page redirected (likely to login) - session might have expired');
    } else {
      console.log('❌ Messages page failed to load');
      console.log('Response body:', pageResponse.body.substring(0, 200));
    }
    
    console.log('\n✅ Test completed - Talent Messages page fix verification done');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTalentMessagesPage();
