const axios = require('axios');

async function testApplicationFunctionality() {
    const baseURL = 'http://localhost:3000';
    
    console.log('🚀 Testing Event Talents Platform functionality...\n');
    
    const tests = [
        { name: 'Homepage', path: '/' },
        { name: 'Explore Packages', path: '/explore-packages' },
        { name: 'Auth Login', path: '/auth/login' },
        { name: 'Auth Signup', path: '/auth/signup' },
        { name: 'Explore Packages with Search', path: '/explore-packages?search=DJ' },
        { name: 'Admin Login', path: '/admin' },
        { name: 'API Health Check', path: '/api/admin/health' }
    ];
    
    for (const test of tests) {
        try {
            const response = await axios.get(`${baseURL}${test.path}`, {
                timeout: 5000,
                validateStatus: function (status) {
                    return status >= 200 && status < 500; // Accept 2xx, 3xx, 4xx but not 5xx
                }
            });
            
            const statusColor = response.status >= 200 && response.status < 300 ? '✅' : 
                               response.status >= 300 && response.status < 400 ? '🔄' : '⚠️';
            console.log(`${statusColor} ${test.name}: ${response.status}`);
        } catch (error) {
            console.log(`❌ ${test.name}: Error - ${error.message}`);
        }
    }
    
    console.log('\n🎉 Application functionality test completed!');
}

testApplicationFunctionality().catch(console.error);
