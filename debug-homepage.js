const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('🚀 Starting browser test...');
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Capture all network requests
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        console.log(`📡 API Response: ${response.status()} ${url}`);
      }
    });
    
    // Listen for console errors/logs
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      } else if (type === 'warn') {
        console.log(`⚠️  Console Warning: ${msg.text()}`);
      }
    });
    
    // Listen for JavaScript errors
    page.on('pageerror', err => {
      console.log(`💥 JavaScript Error: ${err.message}`);
    });
    
    console.log('🌍 Navigating to homepage...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    // Wait for React to potentially load data
    console.log('⏳ Waiting for content to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check current page state
    const pageState = await page.evaluate(() => {
      return {
        title: document.title,
        hasLoadingText: document.body.textContent.includes('Loading top talents...'),
        hasHeroText: document.body.textContent.includes('Unforgettable Events'),
        hasApiContent: document.body.textContent.includes('Browse Our Top Talent'),
        bodyLength: document.body.textContent.length
      };
    });
    
    console.log('📊 Page State Analysis:');
    console.log(`  - Title: ${pageState.title}`);
    console.log(`  - Still loading: ${pageState.hasLoadingText}`);
    console.log(`  - Has hero: ${pageState.hasHeroText}`);
    console.log(`  - Has API content: ${pageState.hasApiContent}`);
    console.log(`  - Body length: ${pageState.bodyLength} chars`);
    
    await browser.close();
    console.log('✅ Test completed');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (browser) await browser.close();
  }
})();
