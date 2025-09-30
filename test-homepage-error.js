const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('Starting browser...');
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Console Error:', msg.text());
      }
    });
    
    // Listen for JavaScript errors
    page.on('pageerror', err => {
      console.log('❌ JavaScript Error:', err.message);
    });
    
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 10000
    });
    
    // Wait a bit for any async operations
    await page.waitForTimeout(3000);
    
    // Check if loading text is still present
    const loadingText = await page.$eval('body', (body) => {
      return body.textContent.includes('Loading top talents...');
    });
    
    console.log('Homepage loading status:');
    console.log('- Still showing loading text:', loadingText);
    
    // Check what's actually rendered
    const pageContent = await page.$eval('body', (body) => {
      const text = body.textContent;
      return {
        hasHeroText: text.includes('Unforgettable Events'),
        hasLoadingText: text.includes('Loading top talents...'),
        hasPackagesSection: text.includes('Explore Our Packages'),
        hasTalentsSection: text.includes('Browse Our Top Talent'),
        hasTestimonialsSection: text.includes('What Our Clients Say')
      };
    });
    
    console.log('Page content analysis:', pageContent);
    
    await browser.close();
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
    if (browser) await browser.close();
  }
})();
