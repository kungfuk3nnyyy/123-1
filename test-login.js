// Test script to verify login flow
const testAccounts = [
  { role: 'ADMIN', email: 'john@doe.com', password: 'johndoe123' },
  { role: 'TALENT', email: 'sarah.photographer@example.com', password: 'password123' },
  { role: 'ORGANIZER', email: 'contact@eventpro.ke', password: 'password123' }
];

async function testLogin(account) {
  console.log(`\n🧪 Testing login for ${account.role}: ${account.email}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: account.email,
        password: account.password,
        redirect: false
      })
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      console.log(`   ✅ Login successful for ${account.role}`);
      return true;
    } else {
      console.log(`   ❌ Login failed for ${account.role}`);
      return false;
    }
  } catch (error) {
    console.log(`   ⚠️ Error testing ${account.role}:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting login flow tests...');
  
  for (const account of testAccounts) {
    await testLogin(account);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
  }
  
  console.log('\n✅ All login tests completed!');
}

runTests();
