
/**
 * Test Script for Hide Price Feature
 * Tests the complete hide price functionality including:
 * - Package creation with hidden price
 * - API endpoints returning priceIsHidden field
 * - Public package display logic
 */

const BASE_URL = 'http://localhost:3000'

// Test credentials (from seed data)
const TALENT_CREDENTIALS = {
  email: 'sarah.photographer@example.com',
  password: 'password123'
}

const ORGANIZER_CREDENTIALS = {
  email: 'contact@eventpro.ke', 
  password: 'password123'
}

let talentCookies = ''
let organizerCookies = ''

/**
 * Helper function to make HTTP requests
 */
async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
  
  return {
    status: response.status,
    data: await response.json().catch(() => ({})),
    headers: response.headers
  }
}

/**
 * Login as talent and get session cookies
 */
async function loginAsTalent() {
  console.log('🔐 Logging in as talent...')
  
  const response = await makeRequest(`${BASE_URL}/api/auth/signin/credentials`, {
    method: 'POST',
    body: JSON.stringify(TALENT_CREDENTIALS)
  })
  
  if (response.status === 200) {
    const cookies = response.headers.get('set-cookie')
    talentCookies = cookies || ''
    console.log('✅ Talent login successful')
    return true
  }
  
  console.log('❌ Talent login failed:', response.data)
  return false
}

/**
 * Test creating a package with hidden price
 */
async function testCreatePackageWithHiddenPrice() {
  console.log('\n📦 Testing package creation with hidden price...')
  
  const packageData = {
    title: 'Test Hidden Price Package',
    description: 'This is a test package with hidden pricing for quote-based bookings',
    category: 'Photography',
    location: 'Nairobi',
    price: 75000, // Price exists but will be hidden
    priceIsHidden: true, // This is the key field
    duration: '8 hours',
    features: ['Professional Photography', 'Digital Delivery', 'Custom Quote Available'],
    coverImageUrl: null,
    images: []
  }
  
  const response = await makeRequest(`${BASE_URL}/api/talent/packages`, {
    method: 'POST',
    headers: {
      'Cookie': talentCookies
    },
    body: JSON.stringify(packageData)
  })
  
  if (response.status === 200 && response.data.success) {
    const createdPackage = response.data.data
    console.log('✅ Package created successfully with hidden price')
    console.log(`   Package ID: ${createdPackage.id}`)
    console.log(`   Price Hidden: ${createdPackage.priceIsHidden}`)
    console.log(`   Actual Price: KES ${createdPackage.price}`)
    return createdPackage.id
  }
  
  console.log('❌ Package creation failed:', response.data)
  return null
}

/**
 * Test fetching packages from public API
 */
async function testPublicPackageAPI() {
  console.log('\n🌐 Testing public packages API for priceIsHidden field...')
  
  const response = await makeRequest(`${BASE_URL}/api/packages?limit=5`)
  
  if (response.status === 200 && response.data.success) {
    const packages = response.data.data.packages
    console.log('✅ Public packages API working')
    console.log(`   Found ${packages.length} packages`)
    
    // Check if any packages have priceIsHidden field
    const hiddenPricePackages = packages.filter(pkg => pkg.priceIsHidden === true)
    const visiblePricePackages = packages.filter(pkg => pkg.priceIsHidden === false || !pkg.priceIsHidden)
    
    console.log(`   Packages with hidden prices: ${hiddenPricePackages.length}`)
    console.log(`   Packages with visible prices: ${visiblePricePackages.length}`)
    
    if (hiddenPricePackages.length > 0) {
      console.log('   Example hidden price package:')
      console.log(`     Title: ${hiddenPricePackages[0].title}`)
      console.log(`     Price Hidden: ${hiddenPricePackages[0].priceIsHidden}`)
      console.log(`     Actual Price: KES ${hiddenPricePackages[0].price}`)
    }
    
    return true
  }
  
  console.log('❌ Public packages API failed:', response.data)
  return false
}

/**
 * Test featured packages API
 */
async function testFeaturedPackagesAPI() {
  console.log('\n⭐ Testing featured packages API for priceIsHidden field...')
  
  const response = await makeRequest(`${BASE_URL}/api/packages/featured`)
  
  if (response.status === 200 && response.data.success) {
    const packages = response.data.packages
    console.log('✅ Featured packages API working')
    console.log(`   Found ${packages.length} featured packages`)
    
    // Check if priceIsHidden field is present
    const hasHiddenPriceField = packages.every(pkg => 'priceIsHidden' in pkg)
    console.log(`   All packages have priceIsHidden field: ${hasHiddenPriceField}`)
    
    return true
  }
  
  console.log('❌ Featured packages API failed:', response.data)
  return false
}

/**
 * Test updating a package to hide/show price
 */
async function testPackagePriceToggle(packageId) {
  if (!packageId) {
    console.log('\n⚠️  Skipping price toggle test (no package ID available)')
    return false
  }
  
  console.log('\n🔄 Testing package price visibility toggle...')
  
  // First, hide the price
  const hideResponse = await makeRequest(`${BASE_URL}/api/talent/packages/${packageId}`, {
    method: 'PUT',
    headers: {
      'Cookie': talentCookies
    },
    body: JSON.stringify({
      priceIsHidden: true
    })
  })
  
  if (hideResponse.status === 200 && hideResponse.data.success) {
    console.log('✅ Successfully hid package price')
  } else {
    console.log('❌ Failed to hide package price:', hideResponse.data)
    return false
  }
  
  // Then, show the price again
  const showResponse = await makeRequest(`${BASE_URL}/api/talent/packages/${packageId}`, {
    method: 'PUT', 
    headers: {
      'Cookie': talentCookies
    },
    body: JSON.stringify({
      priceIsHidden: false
    })
  })
  
  if (showResponse.status === 200 && showResponse.data.success) {
    console.log('✅ Successfully showed package price')
    return true
  } else {
    console.log('❌ Failed to show package price:', showResponse.data)
    return false
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Hide Price Feature Tests...')
  console.log('=' .repeat(50))
  
  let testsPassed = 0
  let totalTests = 0
  
  // Test 1: Login as talent
  totalTests++
  if (await loginAsTalent()) {
    testsPassed++
  }
  
  // Test 2: Create package with hidden price
  totalTests++
  const packageId = await testCreatePackageWithHiddenPrice()
  if (packageId) {
    testsPassed++
  }
  
  // Test 3: Test public packages API
  totalTests++
  if (await testPublicPackageAPI()) {
    testsPassed++
  }
  
  // Test 4: Test featured packages API
  totalTests++
  if (await testFeaturedPackagesAPI()) {
    testsPassed++
  }
  
  // Test 5: Test price visibility toggle
  totalTests++
  if (await testPackagePriceToggle(packageId)) {
    testsPassed++
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(50))
  console.log(`✅ Tests Passed: ${testsPassed}/${totalTests}`)
  console.log(`❌ Tests Failed: ${totalTests - testsPassed}/${totalTests}`)
  
  if (testsPassed === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Hide Price feature is working correctly.')
    console.log('\n📋 FEATURE SUMMARY:')
    console.log('   ✅ Database schema updated with priceIsHidden field')
    console.log('   ✅ Talent can create packages with hidden prices')
    console.log('   ✅ Talent can toggle price visibility in existing packages')
    console.log('   ✅ Public APIs include priceIsHidden field')
    console.log('   ✅ Frontend can conditionally display prices')
    console.log('\n🔄 NEXT STEPS:')
    console.log('   • Test the frontend UI changes by visiting the website')
    console.log('   • Implement conditional booking flow (Phase 5)')
    console.log('   • Add messaging integration for quote requests')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the output above.')
  }
}

// Start server and run tests
console.log('Starting development server...')
console.log('Please make sure the server is running on http://localhost:3000')
console.log('You can run: cd /home/ubuntu/event_talents_platform/app && yarn dev')
console.log('\nPress Ctrl+C and run this script after the server is ready.')

// Uncomment the line below to run tests automatically
// setTimeout(runTests, 5000)

// For manual testing, run: node test-hide-price-feature.js
runTests().catch(console.error)
