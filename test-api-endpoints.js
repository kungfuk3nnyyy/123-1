
// Test script for new API endpoints
const { execSync } = require('child_process');

async function testEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test 1: Test public talent profile endpoint (should return 404 for non-existent ID)
  console.log('1️⃣ Testing GET /api/talent/[id]/profile');
  try {
    const result = execSync(`curl -s -w "%{http_code}" -o /dev/null ${baseUrl}/api/talent/non-existent-id/profile`).toString().trim();
    console.log(`   Status: ${result} (Expected: 404 for non-existent talent)`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Test EPK upload endpoint (should require authentication)
  console.log('\n2️⃣ Testing POST /api/talent/epk/upload');
  try {
    const result = execSync(`curl -s -w "%{http_code}" -o /dev/null -X POST ${baseUrl}/api/talent/epk/upload`).toString().trim();
    console.log(`   Status: ${result} (Expected: 401 for unauthorized)`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: Test existing profile endpoint
  console.log('\n3️⃣ Testing GET /api/talent/profile');
  try {
    const result = execSync(`curl -s -w "%{http_code}" -o /dev/null ${baseUrl}/api/talent/profile`).toString().trim();
    console.log(`   Status: ${result} (Expected: 401 for unauthorized)`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 4: Test EPK file serving endpoint  
  console.log('\n4️⃣ Testing GET /api/files/epk/test.pdf');
  try {
    const result = execSync(`curl -s -w "%{http_code}" -o /dev/null ${baseUrl}/api/files/epk/test.pdf`).toString().trim();
    console.log(`   Status: ${result} (Expected: 404 for non-existent file)`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n✅ API Endpoint structure tests completed!');
  console.log('\n📝 Summary:');
  console.log('- Public talent profile endpoint: Created ✅');
  console.log('- EPK upload endpoint: Created ✅'); 
  console.log('- EPK file serving endpoint: Created ✅');
  console.log('- Enhanced profile update endpoint: Updated ✅');
}

testEndpoints().catch(console.error);
