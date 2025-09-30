
// Paste this into the browser console on the login page
async function testAdminLogin() {
    console.log('🔐 Testing admin login...');
    
    // Fill in the form fields
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const submitButton = document.querySelector('button[type="submit"]');
    
    if (!emailInput || !passwordInput || !submitButton) {
        console.error('❌ Could not find form elements');
        return;
    }
    
    // Clear and fill the fields
    emailInput.value = '';
    passwordInput.value = '';
    emailInput.value = 'john@doe.com';
    passwordInput.value = 'johndoe123';
    
    console.log('✅ Form fields filled');
    console.log('📧 Email:', emailInput.value);
    console.log('🔑 Password:', passwordInput.value.replace(/./g, '*'));
    
    // Submit the form
    console.log('🚀 Submitting form...');
    submitButton.click();
    
    // Wait for redirect
    setTimeout(() => {
        console.log('🌐 Current URL:', window.location.href);
        if (window.location.href.includes('/admin')) {
            console.log('✅ Successfully redirected to admin dashboard!');
        } else if (window.location.href.includes('/login')) {
            console.log('❌ Login failed - still on login page');
        } else {
            console.log('🔄 Redirected to:', window.location.href);
        }
    }, 2000);
}

// Also test API endpoints once logged in
async function testAdminAPIs() {
    console.log('🔍 Testing admin API endpoints...');
    
    const endpoints = [
        '/api/dashboard/admin',
        '/api/admin/users?limit=5',
        '/api/admin/bookings?limit=5', 
        '/api/admin/packages?limit=5',
        '/api/admin/health',
        '/api/admin/analytics/registrations?days=7'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\n📡 Testing ${endpoint}...`);
            const response = await fetch(endpoint);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint}: ${response.status} - Success`);
                console.log('📄 Data:', data);
            } else {
                console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
                if (response.status === 401) {
                    console.log('🔒 Unauthorized - need to login first');
                }
            }
        } catch (error) {
            console.error(`💥 ${endpoint}: ERROR -`, error);
        }
    }
}

console.log('🎯 Admin login test script loaded!');
console.log('📋 Available commands:');
console.log('   - testAdminLogin() - Test login with admin credentials');
console.log('   - testAdminAPIs() - Test admin API endpoints (run after login)');
console.log('');
console.log('🚀 Run testAdminLogin() to start testing');
