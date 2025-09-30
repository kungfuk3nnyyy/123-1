// Run this script in the browser console to test login
console.log('🧪 Event Talents Login Test Script');
console.log('Copy and paste the test functions below into the browser console');

console.log(`
// Test Admin Login
async function testAdminLogin() {
  console.log('🔑 Testing Admin login...');
  const { signIn } = await import('/auth/login');
  // Note: This is just a template - actual implementation depends on NextAuth setup
  console.log('Use the login form with: john@doe.com / johndoe123');
}

// Test Session Check
async function checkSession() {
  try {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    console.log('Current session:', session);
    
    if (session?.user) {
      console.log('✅ User is logged in:', session.user.email, session.user.role);
      console.log('🔄 Redirecting to dashboard...');
      
      // Test the redirect logic
      let redirectPath = '/';
      switch (session.user.role) {
        case 'ADMIN': redirectPath = '/admin'; break;
        case 'TALENT': redirectPath = '/talent'; break;
        case 'ORGANIZER': redirectPath = '/organizer'; break;
      }
      
      console.log('👉 Should redirect to:', redirectPath);
      window.location.href = redirectPath;
    } else {
      console.log('❌ No active session');
    }
  } catch (error) {
    console.error('Session check error:', error);
  }
}

// Manual redirect test
function testRedirect(role) {
  const redirectPaths = {
    'ADMIN': '/admin',
    'TALENT': '/talent', 
    'ORGANIZER': '/organizer'
  };
  
  const path = redirectPaths[role];
  if (path) {
    console.log('Testing redirect to:', path);
    window.location.href = path;
  }
}
`);

console.log('📋 Manual Test Instructions:');
console.log('1. Go to /auth/login and login with:');
console.log('   Admin: john@doe.com / johndoe123');
console.log('   Talent: sarah.photographer@example.com / password123');
console.log('   Organizer: contact@eventpro.ke / password123');
console.log('2. After login, go to homepage (/) and check console for redirect logs');
console.log('3. Run checkSession() in console to verify session state');
