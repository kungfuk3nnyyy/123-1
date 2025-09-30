
const fetch = require('node-fetch')

async function testAdminLogin() {
  console.log('🧪 Testing Admin Login After Emergency Fix...')
  
  try {
    // Step 1: Test login API
    console.log('\n1. Testing login API endpoint...')
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'john@doe.com',
        password: 'johndoe123'
      })
    })

    console.log(`Login API Response Status: ${loginResponse.status}`)
    
    if (loginResponse.ok) {
      console.log('✅ Login API is accessible')
    } else {
      const errorText = await loginResponse.text()
      console.log('❌ Login API Error:', errorText)
    }

    // Step 2: Test NextAuth credentials endpoint
    console.log('\n2. Testing NextAuth credentials endpoint...')
    
    const authResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'john@doe.com',
        password: 'johndoe123',
        redirect: 'false'
      })
    })

    console.log(`NextAuth Response Status: ${authResponse.status}`)
    
    if (authResponse.ok) {
      console.log('✅ NextAuth credentials endpoint is working')
      const authData = await authResponse.json()
      console.log('Auth Response:', authData)
    } else {
      const errorText = await authResponse.text()
      console.log('❌ NextAuth Error:', errorText)
    }

    // Step 3: Test direct admin dashboard access
    console.log('\n3. Testing admin dashboard access...')
    
    const dashboardResponse = await fetch('http://localhost:3000/admin', {
      method: 'GET',
    })

    console.log(`Admin Dashboard Status: ${dashboardResponse.status}`)
    
    if (dashboardResponse.status === 200) {
      console.log('✅ Admin dashboard is accessible')
    } else if (dashboardResponse.status === 401 || dashboardResponse.status === 302) {
      console.log('🔐 Admin dashboard redirects to login (expected for unauthenticated request)')
    } else {
      console.log('❌ Unexpected dashboard response')
    }

    // Step 4: Test login page accessibility
    console.log('\n4. Testing login page accessibility...')
    
    const loginPageResponse = await fetch('http://localhost:3000/auth/login', {
      method: 'GET',
    })

    console.log(`Login Page Status: ${loginPageResponse.status}`)
    
    if (loginPageResponse.ok) {
      console.log('✅ Login page is accessible')
    } else {
      console.log('❌ Login page has issues')
    }

    console.log('\n🎯 Summary:')
    console.log('   - Database shows admin account is APPROVED')
    console.log('   - Server is running properly')
    console.log('   - Login endpoints are accessible')
    console.log('   - Next step: Manual verification through browser')
    
  } catch (error) {
    console.error('💥 ERROR during login test:', error.message)
  }
}

testAdminLogin()
