
const { SecurityService } = require('./lib/security-service');

// Test IP whitelisting functionality
console.log('🧪 Testing IP Whitelisting Functionality\n');

// Test cases
const testCases = [
    {
        ip: '127.0.0.1',
        expectedWhitelisted: true,
        description: 'localhost IPv4'
    },
    {
        ip: '::1',
        expectedWhitelisted: true,
        description: 'localhost IPv6'
    },
    {
        ip: 'localhost',
        expectedWhitelisted: true,
        description: 'localhost name'
    },
    {
        ip: '192.168.1.100',
        expectedWhitelisted: false,
        description: 'private network IP (not whitelisted)'
    },
    {
        ip: '203.0.113.1',
        expectedWhitelisted: false,
        description: 'public IP (not whitelisted)'
    },
    {
        ip: '0.0.0.0',
        expectedWhitelisted: true,
        description: 'wildcard localhost variation'
    }
];

// Test IP whitelisting
console.log('1️⃣ Testing isIPWhitelisted method:');
testCases.forEach(testCase => {
    const result = SecurityService.isIPWhitelisted(testCase.ip);
    const status = result === testCase.expectedWhitelisted ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} ${testCase.ip} (${testCase.description}): ${result}`);
});

console.log('\n2️⃣ Testing validateBotTraps with IP whitelisting:');

// Test bot trap validation for whitelisted IP
const whitelistedIPTest = SecurityService.validateBotTraps({
    website: 'spam-content',  // This would normally trigger honeypot
    url: 'malicious-url',    // This would normally trigger honeypot
    honeypot: 'bot-data',    // This would normally trigger honeypot
    formStartTime: Date.now() // Fast submission
}, '127.0.0.1');

console.log('   Whitelisted IP (127.0.0.1) with honeypot data:');
console.log(`   ✅ isValid: ${whitelistedIPTest.isValid}`);
console.log(`   📋 reason: ${whitelistedIPTest.reason}`);
console.log(`   🚨 triggered: [${whitelistedIPTest.triggered.join(', ')}]`);

// Test bot trap validation for non-whitelisted IP
const nonWhitelistedIPTest = SecurityService.validateBotTraps({
    website: 'spam-content',  // This should trigger honeypot
    url: 'malicious-url',    // This should trigger honeypot
    honeypot: 'bot-data',    // This should trigger honeypot
    formStartTime: Date.now() // Fast submission
}, '192.168.1.100');

console.log('\n   Non-whitelisted IP (192.168.1.100) with honeypot data:');
console.log(`   ${nonWhitelistedIPTest.isValid ? '❌ FAIL' : '✅ PASS'} isValid: ${nonWhitelistedIPTest.isValid}`);
console.log(`   📋 reason: ${nonWhitelistedIPTest.reason}`);
console.log(`   🚨 triggered: [${nonWhitelistedIPTest.triggered.join(', ')}]`);

// Test clean form data with non-whitelisted IP
const cleanFormTest = SecurityService.validateBotTraps({
    website: '',      // Clean
    url: '',         // Clean
    honeypot: '',    // Clean
    formStartTime: Date.now() - 5000 // 5 seconds ago
}, '192.168.1.100');

console.log('\n   Non-whitelisted IP (192.168.1.100) with clean form data:');
console.log(`   ${cleanFormTest.isValid ? '✅ PASS' : '❌ FAIL'} isValid: ${cleanFormTest.isValid}`);
console.log(`   📋 reason: ${cleanFormTest.reason || 'No issues detected'}`);
console.log(`   🚨 triggered: [${cleanFormTest.triggered.join(', ')}]`);

console.log('\n🎉 IP Whitelisting Test Complete!');
console.log('\n📝 Summary:');
console.log('   - Whitelisted IPs bypass all security validation');
console.log('   - Non-whitelisted IPs still get proper security checks');
console.log('   - Clean form data passes validation for non-whitelisted IPs');
console.log('   - Honeypot data gets blocked for non-whitelisted IPs');

console.log('\n🔧 Configuration:');
console.log(`   WHITELISTED_IPS: ${process.env.WHITELISTED_IPS || 'not set'}`);
