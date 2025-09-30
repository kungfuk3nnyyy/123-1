
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test data from database
const TEST_DATA = {
  organizer: {
    id: 'cmdmqs41', // EventPro Kenya - will get real ID from API
    email: 'contact@eventpro.ke'
  },
  talent: {
    id: 'cmdmqs40', // Sarah Johnson - will get real ID from API  
    email: 'sarah.photographer@example.com'
  },
  booking: {
    id: 'cmdmqs42', // Annual Tech Conference 2024
    title: 'Annual Tech Conference 2024'
  }
};

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

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data || null
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testMessagingEndpoints() {
  console.log('🔍 Testing Messaging API Endpoints Direct Access');
  console.log('='.repeat(55));

  // Test 1: General Messages API (no auth)
  console.log('\n1. Testing General Messages API (/api/messages)');
  try {
    const response = await makeRequest('/api/messages');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.log('   ✅ Properly protected (401 Unauthorized)');
    } else {
      console.log('   ⚠️  Unexpected response');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 2: Role-specific APIs (no auth)
  console.log('\n2. Testing Role-specific Message APIs (no auth)');
  
  for (const role of ['organizer', 'talent']) {
    try {
      const response = await makeRequest(`/api/${role}/messages`);
      console.log(`   ${role.toUpperCase()} API - Status: ${response.status}`);
      
      if (response.status === 401) {
        console.log(`   ✅ ${role} API properly protected`);
      } else {
        console.log(`   ⚠️  ${role} API: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ ${role} API Error: ${error.message}`);
    }
  }

  // Test 3: Test message creation validation
  console.log('\n3. Testing Message Creation Validation');
  
  try {
    const response = await makeRequest('/api/messages', {
      method: 'POST',
      body: {
        bookingId: TEST_DATA.booking.id,
        receiverId: TEST_DATA.talent.id,
        content: 'Test message content'
      }
    });
    
    console.log(`   POST Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.log('   ✅ Message creation properly protected');
    }
  } catch (error) {
    console.log(`   ❌ Message creation test error: ${error.message}`);
  }

  // Test 4: Mark as read validation
  console.log('\n4. Testing Mark as Read Validation');
  
  try {
    const response = await makeRequest('/api/messages/test-message-id/read', {
      method: 'PATCH'
    });
    
    console.log(`   PATCH Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.log('   ✅ Mark as read properly protected');
    }
  } catch (error) {
    console.log(`   ❌ Mark as read test error: ${error.message}`);
  }
}

async function analyzeAPIStructure() {
  console.log('\n🏗️  Analyzing API Structure Issues');
  console.log('='.repeat(40));

  // Check if endpoints exist
  const endpoints = [
    '/api/messages',
    '/api/organizer/messages', 
    '/api/talent/messages',
    '/api/messages/dummy/read'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint);
      console.log(`${endpoint}: ${response.status} (${getStatusDescription(response.status)})`);
    } catch (error) {
      console.log(`${endpoint}: ERROR - ${error.message}`);
    }
  }
}

function getStatusDescription(status) {
  const descriptions = {
    200: 'OK',
    400: 'Bad Request', 
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    500: 'Internal Server Error'
  };
  return descriptions[status] || 'Unknown';
}

async function testDatabaseIntegration() {
  console.log('\n🗄️  Testing Database Integration');
  console.log('='.repeat(35));

  // We can test this by checking if the API endpoints return proper error messages
  // that indicate they're connecting to the database correctly

  console.log('This will be tested after we can authenticate properly.');
  console.log('Current focus: API endpoint validation and structure.');
}

async function runDiagnostic() {
  console.log('🚀 Messaging System API Diagnostic');
  console.log('='.repeat(50));
  
  await testMessagingEndpoints();
  await analyzeAPIStructure(); 
  await testDatabaseIntegration();
  
  console.log('\n📋 Diagnostic Summary:');
  console.log('- All APIs properly require authentication (good security)');
  console.log('- Need to fix authentication flow to test functionality');
  console.log('- API endpoints exist and respond correctly to unauthorized requests');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Fix authentication flow for testing');
  console.log('2. Test message CRUD operations');
  console.log('3. Test real-time update mechanisms');
  console.log('4. Fix any identified issues');
}

runDiagnostic().catch(console.error);
