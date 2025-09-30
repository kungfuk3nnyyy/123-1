
const puppeteer = require('puppeteer')

async function testTalentMessages() {
  console.log('🔍 Testing Talent Messages page for JavaScript errors...')
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    
    // Capture console messages
    page.on('console', message => {
      console.log(`🖥️  CONSOLE [${message.type()}]: ${message.text()}`)
    })
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      console.error(`❌ PAGE ERROR: ${error.message}`)
      console.error(`Stack: ${error.stack}`)
    })
    
    console.log('📍 Navigating to login page...')
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle2' })
    
    console.log('🔐 Logging in with test credentials...')
    await page.type('[name="email"]', 'john@doe.com')
    await page.type('[name="password"]', 'johndoe123')
    
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ])
    
    console.log('📨 Navigating to Talent Messages page...')
    await page.goto('http://localhost:3000/talent/messages', { waitUntil: 'networkidle2' })
    
    // Wait a moment for any async operations
    await page.waitForTimeout(3000)
    
    console.log('✅ Test completed')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

testTalentMessages().catch(console.error)
