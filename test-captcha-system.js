
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

console.log('🔒 Testing Comprehensive CAPTCHA System');
console.log('=====================================\n');

async function testSecurityStatus() {
  console.log('1️⃣ Testing Security Status API...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/security-status`);
    const result = await response.json();
    
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(result, null, 2));
    
    if (result.success && typeof result.data.requiresCaptcha === 'boolean') {
      console.log('   ✅ Security status API working correctly\n');
      return result.data;
    } else {
      console.log('   ❌ Security status API failed\n');
      return null;
    }
  } catch (error) {
    console.log('   ❌ Security status API error:', error.message, '\n');
    return null;
  }
}

async function testCaptchaGeneration() {
  console.log('2️⃣ Testing CAPTCHA Generation API...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/captcha/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data.sessionId && result.data.question) {
      console.log('   ✅ CAPTCHA generation working correctly');
      console.log('   📝 Generated question:', result.data.question);
      console.log('');
      return result.data;
    } else {
      console.log('   ❌ CAPTCHA generation failed\n');
      return null;
    }
  } catch (error) {
    console.log('   ❌ CAPTCHA generation error:', error.message, '\n');
    return null;
  }
}

async function testCaptchaValidation(captchaData) {
  if (!captchaData) {
    console.log('3️⃣ Skipping CAPTCHA validation (no captcha data)\n');
    return false;
  }

  console.log('3️⃣ Testing CAPTCHA Validation API...');
  
  // Parse the math question to get the correct answer
  const question = captchaData.question;
  let correctAnswer = null;
  
  try {
    // Extract numbers and operation from question like "What is 5 + 3?"
    const match = question.match(/What is (\d+) ([+\-×]) (\d+)\?/);
    if (match) {
      const num1 = parseInt(match[1]);
      const operation = match[2];
      const num2 = parseInt(match[3]);
      
      switch (operation) {
        case '+':
          correctAnswer = num1 + num2;
          break;
        case '-':
          correctAnswer = num1 - num2;
          break;
        case '×':
          correctAnswer = num1 * num2;
          break;
      }
    }
    
    if (correctAnswer === null) {
      console.log('   ❌ Could not parse math question:', question, '\n');
      return false;
    }
    
    console.log('   🧮 Calculated answer:', correctAnswer);
    
    // Test with correct answer
    const response = await fetch(`${BASE_URL}/api/auth/captcha/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: captchaData.sessionId,
        answer: correctAnswer.toString()
      })
    });
    
    const result = await response.json();
    
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.isValid) {
      console.log('   ✅ CAPTCHA validation working correctly\n');
      return true;
    } else {
      console.log('   ❌ CAPTCHA validation failed\n');
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ CAPTCHA validation error:', error.message, '\n');
    return false;
  }
}

async function testCaptchaRefresh(oldSessionId) {
  console.log('4️⃣ Testing CAPTCHA Refresh API...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/captcha/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldSessionId: oldSessionId
      })
    });
    
    const result = await response.json();
    
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data.sessionId && result.data.question) {
      console.log('   ✅ CAPTCHA refresh working correctly');
      console.log('   📝 New question:', result.data.question);
      console.log('');
      return result.data;
    } else {
      console.log('   ❌ CAPTCHA refresh failed\n');
      return null;
    }
  } catch (error) {
    console.log('   ❌ CAPTCHA refresh error:', error.message, '\n');
    return null;
  }
}

async function testBotTrapDetection() {
  console.log('5️⃣ Testing Bot Trap Detection (Signup with honeypot)...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Bot',
        email: 'bot@test.com',
        password: 'password123',
        role: 'TALENT',
        // Bot trap fields - these should trigger security validation failure
        website: 'http://bot-site.com', // Honeypot field
        honeypot: 'bot-filled-this',    // Honeypot field
        formStartTime: Date.now().toString() // Immediate submission (too fast)
      })
    });
    
    const result = await response.json();
    
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 400 && result.error === 'Security validation failed') {
      console.log('   ✅ Bot trap detection working correctly\n');
      return true;
    } else {
      console.log('   ❌ Bot trap detection failed - should have rejected bot signup\n');
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Bot trap detection error:', error.message, '\n');
    return false;
  }
}

async function testLegitimateSignup() {
  console.log('6️⃣ Testing Legitimate Signup (without traps)...');
  try {
    const startTime = Date.now() - 5000; // 5 seconds ago (legitimate timing)
    
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Legitimate User',
        email: `legit${Date.now()}@test.com`, // Unique email
        password: 'password123',
        role: 'TALENT',
        // No honeypot fields filled
        website: '',
        honeypot: '',
        url: '',
        formStartTime: startTime.toString()
      })
    });
    
    const result = await response.json();
    
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 200 && result.requiresEmailVerification) {
      console.log('   ✅ Legitimate signup working correctly\n');
      return true;
    } else {
      console.log('   ❌ Legitimate signup failed\n');
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Legitimate signup error:', error.message, '\n');
    return false;
  }
}

async function testFormPages() {
  console.log('7️⃣ Testing Form Pages Load...');
  try {
    // Test login page
    const loginResponse = await fetch(`${BASE_URL}/auth/login`);
    console.log('   Login page status:', loginResponse.status);
    
    // Test signup page
    const signupResponse = await fetch(`${BASE_URL}/auth/signup`);
    console.log('   Signup page status:', signupResponse.status);
    
    if (loginResponse.status === 200 && signupResponse.status === 200) {
      console.log('   ✅ Form pages loading correctly\n');
      return true;
    } else {
      console.log('   ❌ Form pages failed to load\n');
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Form pages error:', error.message, '\n');
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive CAPTCHA system tests...\n');
  
  const results = {
    securityStatus: false,
    captchaGeneration: false,
    captchaValidation: false,
    captchaRefresh: false,
    botTrapDetection: false,
    legitimateSignup: false,
    formPages: false
  };
  
  // Test 1: Security Status
  const securityStatus = await testSecurityStatus();
  results.securityStatus = securityStatus !== null;
  
  // Test 2: CAPTCHA Generation
  const captchaData = await testCaptchaGeneration();
  results.captchaGeneration = captchaData !== null;
  
  // Test 3: CAPTCHA Validation
  results.captchaValidation = await testCaptchaValidation(captchaData);
  
  // Test 4: CAPTCHA Refresh
  const refreshedCaptcha = await testCaptchaRefresh(captchaData?.sessionId);
  results.captchaRefresh = refreshedCaptcha !== null;
  
  // Test 5: Bot Trap Detection
  results.botTrapDetection = await testBotTrapDetection();
  
  // Test 6: Legitimate Signup
  results.legitimateSignup = await testLegitimateSignup();
  
  // Test 7: Form Pages
  results.formPages = await testFormPages();
  
  // Summary
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  }
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All CAPTCHA system components are working correctly!');
  } else {
    console.log('⚠️  Some CAPTCHA system components need attention.');
  }
  
  return results;
}

// Run the tests
runAllTests().catch(console.error);
