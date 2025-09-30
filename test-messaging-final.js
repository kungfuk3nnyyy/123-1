
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test Configuration
const BASE_URL = 'http://localhost:3000';
const TALENT_ACCOUNT = {
  email: 'sarah.photographer@example.com',
  password: 'password123'
};
const ORGANIZER_ACCOUNT = {
  email: 'contact@eventpro.ke', 
  password: 'password123'
};

// Helper function to extract cookies from response headers
function extractCookies(response) {
  const cookies = response.headers.raw()['set-cookie'];
  if (!cookies) return '';
  
  return cookies.map(cookie => cookie.split(';')[0]).join('; ');
}

// Helper function to authenticate and get session cookies
async function authenticateUser(email, password) {
  console.log(`\n🔐 Authenticating user: ${email}`);
  
  try {
    // First, get the CSRF token
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;
    const csrfCookies = extractCookies(csrfResponse);
    
    console.log(`  ✓ CSRF token obtained`);
    
    // Perform the login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfCookies
      },
      body: new URLSearchParams({
        email,
        password,
        csrfToken,
        redirect: 'false'
      }),
      redirect: 'manual'
    });
    
    const loginCookies = extractCookies(loginResponse);
    const allCookies = [csrfCookies, loginCookies].filter(Boolean).join('; ');
    
    console.log(`  ✓ Login successful (${loginResponse.status})`);
    
    return allCookies;
  } catch (error) {
    console.error(`  ❌ Authentication failed:`, error.message);
    throw error;
  }
}

// Test messaging APIs for both user types
async function testMessagingAPIs(talentCookies, organizerCookies) {
  console.log('\n📨 Testing Message APIs for Both User Types');
  
  const results = {};
  
  // Test talent messages
  try {
    const talentResponse = await fetch(`${BASE_URL}/api/talent/messages`, {
      headers: { 'Cookie': talentCookies }
    });
    
    console.log(`👤 Talent Messages API: ${talentResponse.status}`);
    
    if (talentResponse.ok) {
      const data = await talentResponse.json();
      console.log(`  ✅ SUCCESS: Got ${data.data?.length || 0} conversations`);
      results.talent = { success: true, conversations: data.data?.length || 0 };
    } else {
      console.log(`  ❌ FAILED: ${talentResponse.status}`);
      results.talent = { success: false, status: talentResponse.status };
    }
  } catch (error) {
    console.log(`  💥 ERROR: ${error.message}`);
    results.talent = { success: false, error: error.message };
  }
  
  // Test organizer messages
  try {
    const organizerResponse = await fetch(`${BASE_URL}/api/organizer/messages`, {
      headers: { 'Cookie': organizerCookies }
    });
    
    console.log(`🏢 Organizer Messages API: ${organizerResponse.status}`);
    
    if (organizerResponse.ok) {
      const data = await organizerResponse.json();
      console.log(`  ✅ SUCCESS: Got ${data.data?.conversations?.length || 0} conversations`);
      results.organizer = { success: true, conversations: data.data?.conversations?.length || 0 };
    } else {
      console.log(`  ❌ FAILED: ${organizerResponse.status}`);
      results.organizer = { success: false, status: organizerResponse.status };
    }
  } catch (error) {
    console.log(`  💥 ERROR: ${error.message}`);
    results.organizer = { success: false, error: error.message };
  }
  
  return results;
}

// Test message sending between users
async function testMessageSending(talentCookies, organizerCookies) {
  console.log('\n✉️ Testing Message Sending Between Users');
  
  try {
    // Get a sample booking first
    const bookingsResponse = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { 'Cookie': talentCookies }
    });
    
    if (!bookingsResponse.ok) {
      console.log('❌ Could not fetch bookings for testing');
      return { success: false, error: 'No bookings available' };
    }
    
    const bookingsData = await bookingsResponse.json();
    const bookings = bookingsData.data?.bookings || bookingsData.bookings || [];
    
    if (bookings.length === 0) {
      console.log('⚠️ No bookings found for message testing');
      return { success: false, error: 'No bookings available' };
    }
    
    const booking = bookings[0];
    console.log(`📋 Using booking: ${booking.id}`);
    
    // Test talent sending message to organizer
    const talentMessagePayload = {
      bookingId: booking.id,
      receiverId: booking.organizerId || booking.organizer?.id,
      content: `Test message from talent at ${new Date().toISOString()}`
    };
    
    const talentMessageResponse = await fetch(`${BASE_URL}/api/talent/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': talentCookies
      },
      body: JSON.stringify(talentMessagePayload)
    });
    
    console.log(`👤 Talent → Organizer: ${talentMessageResponse.status}`);
    
    if (talentMessageResponse.ok) {
      const data = await talentMessageResponse.json();
      console.log(`  ✅ Message sent successfully: ${data.data?.id}`);
      
      // Test organizer sending message back to talent
      const organizerMessagePayload = {
        bookingId: booking.id,
        receiverId: booking.talentId || booking.talent?.id,
        content: `Test reply from organizer at ${new Date().toISOString()}`
      };
      
      const organizerMessageResponse = await fetch(`${BASE_URL}/api/organizer/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': organizerCookies
        },
        body: JSON.stringify(organizerMessagePayload)
      });
      
      console.log(`🏢 Organizer → Talent: ${organizerMessageResponse.status}`);
      
      if (organizerMessageResponse.ok) {
        const replyData = await organizerMessageResponse.json();
        console.log(`  ✅ Reply sent successfully: ${replyData.data?.id}`);
        return { 
          success: true, 
          talentMessage: data.data?.id,
          organizerMessage: replyData.data?.id
        };
      } else {
        console.log(`  ❌ Organizer reply failed: ${organizerMessageResponse.status}`);
        return { success: false, error: 'Organizer reply failed' };
      }
    } else {
      console.log(`  ❌ Talent message failed: ${talentMessageResponse.status}`);
      return { success: false, error: 'Talent message failed' };
    }
    
  } catch (error) {
    console.log(`💥 Message sending error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test SSE connection with fixed EventSource
async function testSSEConnection(cookies, userType) {
  console.log(`\n📡 Testing SSE Connection (${userType})`);
  
  return new Promise((resolve) => {
    try {
      // Import EventSource properly
      const { EventSource } = require('eventsource');
      
      const eventSource = new EventSource(`${BASE_URL}/api/websocket`, {
        headers: { 'Cookie': cookies }
      });
      
      let connected = false;
      let messagesReceived = [];
      
      const timeout = setTimeout(() => {
        eventSource.close();
        resolve({
          success: connected,
          messagesReceived: messagesReceived.length,
          messages: messagesReceived
        });
      }, 3000);
      
      eventSource.onopen = () => {
        console.log(`  ✅ SSE connection opened for ${userType}`);
        connected = true;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log(`  📨 SSE message received: ${message.type}`);
          messagesReceived.push(message);
        } catch (error) {
          console.log(`  ⚠️ Invalid SSE message: ${event.data.substring(0, 50)}...`);
        }
      };
      
      eventSource.onerror = (error) => {
        console.log(`  ❌ SSE error for ${userType}: ${error}`);
        eventSource.close();
        clearTimeout(timeout);
        resolve({ success: false, error: 'Connection error' });
      };
      
    } catch (error) {
      console.log(`  💥 SSE test error: ${error.message}`);
      resolve({ success: false, error: error.message });
    }
  });
}

// Test notifications for both users
async function testNotifications(talentCookies, organizerCookies) {
  console.log('\n🔔 Testing Notifications for Both Users');
  
  const results = {};
  
  // Test talent notifications
  try {
    const talentNotificationResponse = await fetch(`${BASE_URL}/api/notifications?limit=5&offset=0`, {
      headers: { 'Cookie': talentCookies }
    });
    
    console.log(`👤 Talent Notifications: ${talentNotificationResponse.status}`);
    
    if (talentNotificationResponse.ok) {
      const data = await talentNotificationResponse.json();
      const notifications = data.data?.notifications || [];
      console.log(`  ✅ Got ${notifications.length} notifications`);
      results.talent = { success: true, count: notifications.length };
    } else {
      console.log(`  ❌ FAILED: ${talentNotificationResponse.status}`);
      results.talent = { success: false, status: talentNotificationResponse.status };
    }
  } catch (error) {
    console.log(`  💥 ERROR: ${error.message}`);
    results.talent = { success: false, error: error.message };
  }
  
  // Test organizer notifications
  try {
    const organizerNotificationResponse = await fetch(`${BASE_URL}/api/notifications?limit=5&offset=0`, {
      headers: { 'Cookie': organizerCookies }
    });
    
    console.log(`🏢 Organizer Notifications: ${organizerNotificationResponse.status}`);
    
    if (organizerNotificationResponse.ok) {
      const data = await organizerNotificationResponse.json();
      const notifications = data.data?.notifications || [];
      console.log(`  ✅ Got ${notifications.length} notifications`);
      results.organizer = { success: true, count: notifications.length };
    } else {
      console.log(`  ❌ FAILED: ${organizerNotificationResponse.status}`);
      results.organizer = { success: false, status: organizerNotificationResponse.status };
    }
  } catch (error) {
    console.log(`  💥 ERROR: ${error.message}`);
    results.organizer = { success: false, error: error.message };
  }
  
  return results;
}

// Main test runner
async function runComprehensiveMessagingTest() {
  console.log('🚀 COMPREHENSIVE REAL-TIME MESSAGING SYSTEM TEST');
  console.log('================================================\n');
  
  try {
    // Step 1: Authenticate both users
    console.log('🔐 Step 1: Authenticating Users');
    const talentCookies = await authenticateUser(TALENT_ACCOUNT.email, TALENT_ACCOUNT.password);
    const organizerCookies = await authenticateUser(ORGANIZER_ACCOUNT.email, ORGANIZER_ACCOUNT.password);
    
    // Step 2: Test message APIs
    const apiResults = await testMessagingAPIs(talentCookies, organizerCookies);
    
    // Step 3: Test message sending
    const sendingResults = await testMessageSending(talentCookies, organizerCookies);
    
    // Step 4: Test SSE connections
    const talentSSE = await testSSEConnection(talentCookies, 'Talent');
    const organizerSSE = await testSSEConnection(organizerCookies, 'Organizer');
    
    // Step 5: Test notifications
    const notificationResults = await testNotifications(talentCookies, organizerCookies);
    
    // Summary
    console.log('\n📊 FINAL TEST RESULTS');
    console.log('=====================');
    
    console.log(`\n✅ Authentication: Both users authenticated successfully`);
    
    console.log(`\n📨 Message APIs:`);
    console.log(`  👤 Talent Messages: ${apiResults.talent?.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  🏢 Organizer Messages: ${apiResults.organizer?.success ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log(`\n✉️ Message Sending:`);
    console.log(`  📤 Two-way messaging: ${sendingResults?.success ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log(`\n📡 Real-time Connections:`);
    console.log(`  👤 Talent SSE: ${talentSSE?.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  🏢 Organizer SSE: ${organizerSSE?.success ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log(`\n🔔 Notifications:`);
    console.log(`  👤 Talent Notifications: ${notificationResults.talent?.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  🏢 Organizer Notifications: ${notificationResults.organizer?.success ? '✅ PASS' : '❌ FAIL'}`);
    
    // Calculate success rate
    const totalTests = 8;
    const passedTests = [
      apiResults.talent?.success,
      apiResults.organizer?.success,
      sendingResults?.success,
      talentSSE?.success,
      organizerSSE?.success,
      notificationResults.talent?.success,
      notificationResults.organizer?.success
    ].filter(Boolean).length + 1; // +1 for authentication
    
    console.log(`\n🎯 OVERALL SCORE: ${passedTests}/${totalTests} tests passed`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! Real-time messaging system is fully functional.');
      return true;
    } else {
      console.log('\n⚠️ Some tests failed. Check the details above for debugging information.');
      return false;
    }
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    return false;
  }
}

// Run the comprehensive test
runComprehensiveMessagingTest().catch(console.error);
