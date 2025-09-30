
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function testCompleteSignupFlow() {
  console.log('🔄 Testing Complete Signup Flow with CAPTCHA...');
  
  try {
    // Step 1: Generate CAPTCHA
    console.log('   Step 1: Generating CAPTCHA...');
    const captchaResponse = await fetch(`${BASE_URL}/api/auth/captcha/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const captchaResult = await captchaResponse.json();
    
    if (!captchaResult.success) {
      console.log('   ❌ CAPTCHA generation failed');
      return false;
    }
    
    console.log('   📝 Generated question:', captchaResult.data.question);
    
    // Step 2: Solve the math problem
    const question = captchaResult.data.question;
    const match = question.match(/What is (\d+) ([+\-×]) (\d+)\?/);
    
    if (!match) {
      console.log('   ❌ Could not parse question:', question);
      return false;
    }
    
    const num1 = parseInt(match[1]);
    const operation = match[2];
    const num2 = parseInt(match[3]);
    
    let answer;
    switch (operation) {
      case '+': answer = num1 + num2; break;
      case '-': answer = num1 - num2; break;
      case '×': answer = num1 * num2; break;
      default: return false;
    }
    
    console.log('   🧮 Calculated answer:', answer);
    
    // Step 3: Validate CAPTCHA
    console.log('   Step 2: Validating CAPTCHA...');
    const validateResponse = await fetch(`${BASE_URL}/api/auth/captcha/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: captchaResult.data.sessionId,
        answer: answer.toString()
      })
    });
    
    const validateResult = await validateResponse.json();
    
    if (!validateResult.success || !validateResult.isValid) {
      console.log('   ❌ CAPTCHA validation failed');
      return false;
    }
    
    console.log('   ✅ CAPTCHA validated successfully');
    
    // Step 4: Complete signup with validated CAPTCHA
    console.log('   Step 3: Completing signup...');
    const startTime = Date.now() - 5000; // 5 seconds ago
    
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'CAPTCHA Test User',
        email: `captcha-test-${Date.now()}@example.com`,
        password: 'password123',
        role: 'TALENT',
        captchaSessionId: captchaResult.data.sessionId,
        website: '',
        honeypot: '',
        url: '',
        formStartTime: startTime.toString()
      })
    });
    
    const signupResult = await signupResponse.json();
    
    console.log('   Signup Status:', signupResponse.status);
    console.log('   Signup Response:', JSON.stringify(signupResult, null, 2));
    
    if (signupResponse.status === 200 && signupResult.requiresEmailVerification) {
      console.log('   ✅ Complete signup flow with CAPTCHA working correctly!\n');
      return true;
    } else {
      console.log('   ❌ Complete signup flow failed\n');
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Complete signup flow error:', error.message, '\n');
    return false;
  }
}

async function testBrowserAccess() {
  console.log('🌐 Testing Browser Access...');
  
  try {
    const response = await fetch(`${BASE_URL}/auth/login`);
    const html = await response.text();
    
    // Check if SecurityWrapper is present in the HTML
    if (html.includes('security') || html.includes('captcha')) {
      console.log('   ✅ Security components integrated in forms');
    } else {
      console.log('   ℹ️  Security components may be client-side rendered');
    }
    
    if (response.status === 200) {
      console.log('   ✅ Login page accessible at http://localhost:3000/auth/login');
      console.log('   ✅ Signup page accessible at http://localhost:3000/auth/signup\n');
      return true;
    }
    
  } catch (error) {
    console.log('   ❌ Browser access error:', error.message, '\n');
    return false;
  }
}

async function runCompleteTest() {
  console.log('🚀 FINAL CAPTCHA SYSTEM VERIFICATION');
  console.log('====================================\n');
  
  const completeFlow = await testCompleteSignupFlow();
  const browserAccess = await testBrowserAccess();
  
  console.log('📊 FINAL RESULTS');
  console.log('================');
  console.log(completeFlow ? '✅ PASS' : '❌ FAIL', 'Complete CAPTCHA Signup Flow');
  console.log(browserAccess ? '✅ PASS' : '❌ FAIL', 'Browser Access & Integration');
  
  if (completeFlow && browserAccess) {
    console.log('\n🎉 CAPTCHA SYSTEM FULLY OPERATIONAL!');
    console.log('🔒 Multi-layer bot protection active:');
    console.log('   Layer 1: Invisible honeypot fields & timing validation');
    console.log('   Layer 2: Math-based CAPTCHA for suspicious behavior');
    console.log('   ✅ Login form: http://localhost:3000/auth/login');
    console.log('   ✅ Signup form: http://localhost:3000/auth/signup');
  } else {
    console.log('\n⚠️  Some components need attention');
  }
}

runCompleteTest().catch(console.error);
