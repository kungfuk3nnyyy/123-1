const https = require('http');
const querystring = require('querystring');

// Test admin API endpoints without authentication to check error handling
async function testAdminEndpointsWithoutAuth() {
    console.log('🔍 TESTING ADMIN API ENDPOINTS WITHOUT AUTHENTICATION');
    console.log('='.repeat(60));
    
    const endpoints = [
        { path: '/api/dashboard/admin', description: 'Admin Dashboard Stats' },
        { path: '/api/admin/users', description: 'User Management' },
        { path: '/api/admin/bookings', description: 'Booking Management' },
        { path: '/api/admin/packages', description: 'Package Management' },
        { path: '/api/admin/health', description: 'System Health Check' },
        { path: '/api/admin/analytics/registrations?days=7', description: 'Registration Analytics' },
        { path: '/api/admin/analytics/bookings?days=7', description: 'Booking Analytics' },
        { path: '/api/admin/analytics/kyc-summary', description: 'KYC Analytics' },
        { path: '/api/admin/analytics/disputes', description: 'Dispute Analytics' },
        { path: '/api/admin/analytics/top-packages', description: 'Top Packages Analytics' }
    ];

    const results = [];
    
    for (const endpoint of endpoints) {
        try {
            const result = await makeRequest('GET', endpoint.path);
            const status = result.statusCode;
            const isCorrectAuthError = status === 307 || status === 401;
            
            console.log(`📡 ${endpoint.path}`);
            console.log(`   Description: ${endpoint.description}`);
            console.log(`   Status: ${status} ${result.statusMessage}`);
            console.log(`   Auth Protection: ${isCorrectAuthError ? '✅ WORKING' : '❌ ISSUE'}`);
            
            if (!isCorrectAuthError) {
                console.log(`   ⚠️  Expected 307/401 but got ${status}`);
            }
            
            results.push({
                endpoint: endpoint.path,
                description: endpoint.description,
                status,
                authProtection: isCorrectAuthError,
                issue: !isCorrectAuthError
            });
            
            console.log('');
        } catch (error) {
            console.log(`💥 ${endpoint.path}: ERROR - ${error.message}`);
            results.push({
                endpoint: endpoint.path,
                description: endpoint.description,
                error: error.message,
                issue: true
            });
        }
    }
    
    // Summary
    console.log('📊 SUMMARY REPORT');
    console.log('='.repeat(40));
    const totalEndpoints = results.length;
    const workingEndpoints = results.filter(r => r.authProtection).length;
    const issueEndpoints = results.filter(r => r.issue).length;
    
    console.log(`Total Endpoints Tested: ${totalEndpoints}`);
    console.log(`Working Auth Protection: ${workingEndpoints}`);
    console.log(`Issues Found: ${issueEndpoints}`);
    
    if (issueEndpoints > 0) {
        console.log('\n🚨 ISSUES FOUND:');
        results.filter(r => r.issue).forEach(r => {
            console.log(`   - ${r.endpoint}: ${r.error || 'Auth protection not working'}`);
        });
    } else {
        console.log('\n✅ All endpoints have proper authentication protection!');
    }
    
    return results;
}

// Helper function to make HTTP requests
function makeRequest(method, path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    data: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Run the test
testAdminEndpointsWithoutAuth().catch(console.error);
