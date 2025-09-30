const puppeteer = require('puppeteer');

async function testLogoutRedirection() {
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🔍 Testing Logout Redirection Fix...\n');
        
        // Test 1: Check if homepage loads
        console.log('1️⃣ Testing homepage access...');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
        const title = await page.title();
        console.log(`✅ Homepage loaded successfully: ${title}\n`);
        
        // Test 2: Login with test credentials
        console.log('2️⃣ Logging in as test user...');
        await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle2' });
        
        // Fill login form
        await page.type('input[type="email"]', 'john@doe.com');
        await page.type('input[type="password"]', 'johndoe123');
        
        // Submit login
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        
        const currentUrl = page.url();
        console.log(`✅ Logged in successfully, redirected to: ${currentUrl}\n`);
        
        // Test 3: Navigate to dashboard and test logout
        console.log('3️⃣ Testing logout functionality...');
        
        // Click on user dropdown to reveal logout button
        await page.waitForSelector('[data-testid="user-dropdown"], .dropdown-trigger, button[aria-haspopup="true"]', { timeout: 5000 });
        const dropdownButton = await page.$('button[aria-haspopup="true"]');
        if (dropdownButton) {
            await dropdownButton.click();
            await page.waitForTimeout(1000);
        }
        
        // Look for logout button
        const logoutButton = await page.$('text=Sign Out, [data-testid="logout-button"]');
        if (logoutButton) {
            console.log('📤 Found logout button, clicking...');
            await logoutButton.click();
            
            // Wait for redirection
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
            
            const redirectUrl = page.url();
            console.log(`📍 After logout, redirected to: ${redirectUrl}`);
            
            // Check if redirected to homepage
            if (redirectUrl === 'http://localhost:3000/' || redirectUrl.endsWith('/')) {
                console.log('✅ SUCCESS: Logout redirected to homepage as expected!');
            } else if (redirectUrl.includes('/auth/login')) {
                console.log('❌ FAILED: Still redirecting to login page - bug not fixed');
            } else {
                console.log(`⚠️  UNEXPECTED: Redirected to unexpected URL: ${redirectUrl}`);
            }
        } else {
            console.log('❌ Could not find logout button in UI');
        }
        
    } catch (error) {
        console.error('❌ Error during test:', error.message);
    } finally {
        await browser.close();
        console.log('\n🏁 Test completed');
    }
}

testLogoutRedirection().catch(console.error);
