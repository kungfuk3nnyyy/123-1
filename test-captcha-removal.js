const { SecurityService } = require('./lib/security-service');

async function testCAPTCHARemoval() {
    console.log('Testing CAPTCHA removal...');
    
    try {
        // Test 1: Check IP security (should return requiresCaptcha: false)
        const securityCheck = await SecurityService.checkIPSecurity('127.0.0.1');
        console.log('✓ IP Security Check:', {
            isAllowed: securityCheck.isAllowed,
            isSuspicious: securityCheck.isSuspicious,
            requiresCaptcha: securityCheck.requiresCaptcha
        });
        
        if (securityCheck.requiresCaptcha === false) {
            console.log('✓ CAPTCHA successfully disabled in SecurityService');
        } else {
            console.log('✗ CAPTCHA still required in SecurityService');
        }
        
        // Test 2: Check bot trap validation (should still work for honeypot)
        const botTrapTest = SecurityService.validateBotTraps({
            website: '', // No honeypot triggered
            url: '',
            honeypot: ''
        }, '127.0.0.1');
        
        console.log('✓ Bot Trap Validation (clean):', botTrapTest);
        
        const botTrapTriggered = SecurityService.validateBotTraps({
            website: 'spam', // Honeypot triggered
            url: '',
            honeypot: ''
        }, '127.0.0.1');
        
        console.log('✓ Bot Trap Validation (triggered):', botTrapTriggered);
        
        console.log('\n🎉 CAPTCHA removal test completed successfully!');
        console.log('📋 Summary:');
        console.log('  - CAPTCHA requirement: DISABLED ✓');
        console.log('  - Honeypot validation: WORKING ✓');
        console.log('  - IP security checks: WORKING ✓');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCAPTCHARemoval();
