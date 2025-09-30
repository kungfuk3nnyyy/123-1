const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Fill in admin credentials
    await page.type('input[type="email"]', 'john@doe.com');
    await page.type('input[type="password"]', 'johndoe123');
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForNavigation({ timeout: 10000 });
    
    console.log('Current URL:', page.url());
    
    // Navigate to admin dashboard if not already there
    if (!page.url().includes('/admin')) {
      await page.goto('http://localhost:3000/admin');
      await page.waitForSelector('h1', { timeout: 5000 });
    }
    
    console.log('Successfully logged in and navigated to admin dashboard');
    
  } catch (error) {
    console.error('Login test failed:', error);
  } finally {
    await browser.close();
  }
})();
