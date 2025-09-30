
const fetch = require('node-fetch');

async function testHomepageNavigation() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Testing Homepage Navigation Bug...\n');
  
  // Test 1: Check if /?from=dashboard works without authentication
  console.log('📍 Test 1: Testing /?from=dashboard for unauthenticated user');
  try {
    const response = await fetch(`${baseURL}/?from=dashboard`);
    console.log(`Status: ${response.status}`);
    const html = await response.text();
    
    if (html.includes('Unforgettable Events Start Here')) {
      console.log('✅ Unauthenticated user can access homepage with ?from=dashboard');
    } else {
      console.log('❌ Homepage not loading correctly for unauthenticated user');
    }
  } catch (error) {
    console.log('❌ Error accessing homepage:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Login and check dashboard redirect
  console.log('📍 Test 2: Testing login and dashboard redirect');
  try {
    // Login as admin
    const loginResponse = await fetch(`${baseURL}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'john@doe.com',
        password: 'johndoe123',
        redirect: false,
        json: true
      })
    });
    
    console.log(`Login response status: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('✅ Login successful');
      
      // Test homepage access for authenticated user
      console.log('📍 Test 3: Testing homepage access for authenticated user');
      const homepageResponse = await fetch(`${baseURL}/`, {
        headers: {
          'Cookie': cookies || ''
        }
      });
      
      const homepageHtml = await homepageResponse.text();
      console.log(`Homepage response status: ${homepageResponse.status}`);
      
      if (homepageHtml.includes('Redirecting to your dashboard')) {
        console.log('✅ Authenticated user gets redirect message (expected behavior)');
      } else if (homepageHtml.includes('Unforgettable Events Start Here')) {
        console.log('❌ Authenticated user seeing homepage instead of redirect');
      }
      
      // Test homepage with ?from=dashboard for authenticated user
      console.log('📍 Test 4: Testing /?from=dashboard for authenticated user');
      const homepageFromDashboard = await fetch(`${baseURL}/?from=dashboard`, {
        headers: {
          'Cookie': cookies || ''
        }
      });
      
      const homepageFromDashboardHtml = await homepageFromDashboard.text();
      console.log(`/?from=dashboard response status: ${homepageFromDashboard.status}`);
      
      if (homepageFromDashboardHtml.includes('Unforgettable Events Start Here')) {
        console.log('✅ Authenticated user can access homepage with ?from=dashboard');
      } else if (homepageFromDashboardHtml.includes('Redirecting to your dashboard')) {
        console.log('❌ BUG FOUND: Authenticated user still getting redirect with ?from=dashboard');
      } else {
        console.log('❓ Unexpected response for authenticated user with ?from=dashboard');
      }
      
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.log('❌ Error during authentication test:', error.message);
  }
  
  console.log('\n🏁 Test completed');
}

testHomepageNavigation();
