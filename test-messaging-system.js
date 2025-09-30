
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test credentials
const ORGANIZER_CREDS = {
  email: 'contact@eventpro.ke',
  password: 'password123'
};

const TALENT_CREDS = {
  email: 'sarah.photographer@example.com', 
  password: 'password123'
};

let organizerCookies = '';
let talentCookies = '';

async function login(credentials, userType) {
  console.log(`\n🔐 Logging in as ${userType}...`);
  
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: credentials.email,
        password: credentials.password,
        redirect: 'false'
      }),
      redirect: 'manual'
    });

    const cookies = loginResponse.headers.raw()['set-cookie'];
    if (cookies) {
      const cookieString = cookies.map(c => c.split(';')[0]).join('; ');
      console.log(`✅ ${userType} logged in successfully`);
      return cookieString;
    } else {
      console.log(`❌ ${userType} login failed - no cookies received`);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${userType} login error:`, error.message);
    return null;
  }
}

async function testAPICall(endpoint, method = 'GET', body = null, cookies = '', description = '') {
  console.log(`\n🧪 Testing ${description}: ${method} ${endpoint}`);
  
  try {
    const options = {
      method,
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseText = await response.text();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    try {
      const data = JSON.parse(responseText);
      console.log('Response:', JSON.stringify(data, null, 2));
      return { status: response.status, data };
    } catch (e) {
      console.log('Response (text):', responseText);
      return { status: response.status, data: responseText };
    }
  } catch (error) {
    console.error(`❌ API call failed:`, error.message);
    return { status: 0, error: error.message };
  }
}

async function testWebSocketConnection(cookies, userType) {
  console.log(`\n🔌 Testing WebSocket/SSE connection for ${userType}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/websocket`, {
      headers: {
        'Cookie': cookies,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log(`WebSocket endpoint status: ${response.status}`);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 200) {
      console.log('✅ WebSocket/SSE endpoint accessible');
    } else {
      console.log('❌ WebSocket/SSE endpoint failed');
    }
    
    return response.status === 200;
  } catch (error) {
    console.error('❌ WebSocket connection error:', error.message);
    return false;
  }
}

async function runMessagingTests() {
  console.log('🚀 STARTING MESSAGING SYSTEM TESTS\n');
  console.log('==================================');
  
  // Step 1: Login as both users
  organizerCookies = await login(ORGANIZER_CREDS, 'Organizer');
  talentCookies = await login(TALENT_CREDS, 'Talent');
  
  if (!organizerCookies || !talentCookies) {
    console.log('❌ Login failed. Cannot continue tests.');
    return;
  }
  
  console.log('\n📋 TEST 1: API ENDPOINTS');
  console.log('========================');
  
  // Test organizer messages API
  await testAPICall(
    '/api/organizer/messages', 
    'GET', 
    null, 
    organizerCookies, 
    'Organizer get conversations'
  );
  
  // Test talent messages API  
  await testAPICall(
    '/api/talent/messages', 
    'GET', 
    null, 
    talentCookies, 
    'Talent get all messages'
  );
  
  // Test general messages API with organizer cookies
  await testAPICall(
    '/api/messages', 
    'GET', 
    null, 
    organizerCookies, 
    'General messages API (Organizer)'
  );
  
  // Test general messages API with talent cookies
  await testAPICall(
    '/api/messages', 
    'GET', 
    null, 
    talentCookies, 
    'General messages API (Talent)'
  );
  
  console.log('\n📋 TEST 2: WEBSOCKET/SSE CONNECTIONS');
  console.log('===================================');
  
  // Test WebSocket connections
  await testWebSocketConnection(organizerCookies, 'Organizer');
  await testWebSocketConnection(talentCookies, 'Talent');
  
  console.log('\n📋 TEST 3: SEND MESSAGE FUNCTIONALITY');
  console.log('====================================');
  
  // Get booking ID from database first
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const booking = await prisma.booking.findFirst({
      select: { 
        id: true, 
        organizerId: true, 
        talentId: true 
      }
    });
    
    if (booking) {
      console.log(`Found booking ID: ${booking.id}`);
      
      // Test sending message from organizer to talent
      await testAPICall(
        '/api/organizer/messages',
        'POST',
        {
          receiverId: booking.talentId,
          content: 'Test message from organizer via API',
          bookingId: booking.id
        },
        organizerCookies,
        'Organizer send message'
      );
      
      // Test sending message from talent to organizer
      await testAPICall(
        '/api/talent/messages',
        'POST',
        {
          receiverId: booking.organizerId,
          content: 'Test message from talent via API',
          bookingId: booking.id
        },
        talentCookies,
        'Talent send message'
      );
      
    } else {
      console.log('❌ No booking found for messaging test');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Database error:', error);
  }
  
  console.log('\n📋 TEST 4: FETCH UPDATED CONVERSATIONS');
  console.log('=====================================');
  
  // Re-fetch conversations to see new messages
  await testAPICall(
    '/api/organizer/messages', 
    'GET', 
    null, 
    organizerCookies, 
    'Organizer get updated conversations'
  );
  
  await testAPICall(
    '/api/talent/messages', 
    'GET', 
    null, 
    talentCookies, 
    'Talent get updated messages'
  );
  
  console.log('\n🏁 MESSAGING SYSTEM TESTS COMPLETED');
  console.log('===================================');
}

// Run the tests
runMessagingTests().catch(console.error);
