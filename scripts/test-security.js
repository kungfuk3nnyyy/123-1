
const fs = require('fs')
const path = require('path')

// Test security implementation
class SecurityTester {
  constructor() {
    this.testResults = []
  }

  // Test if security files exist
  testSecurityFiles() {
    console.log('🔍 Testing security file structure...')
    
    const requiredFiles = [
      'lib/security/validation.ts',
      'lib/security/sanitization.ts', 
      'lib/security/middleware.ts',
      'lib/security/fileUpload.ts',
      'lib/security/config.ts',
      'lib/security/clientSanitization.ts',
      'lib/security/index.ts',
      'components/security/SecureContent.tsx'
    ]

    let allExist = true
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}`)
      } else {
        console.log(`  ❌ ${file} - MISSING`)
        allExist = false
      }
    }

    this.testResults.push({
      test: 'Security Files Structure',
      passed: allExist,
      details: `${requiredFiles.filter(f => fs.existsSync(f)).length}/${requiredFiles.length} files exist`
    })
  }

  // Test if dependencies are installed
  testDependencies() {
    console.log('\n🔍 Testing security dependencies...')
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      const requiredDeps = ['zod', 'dompurify', '@types/dompurify', 'jsdom', '@types/jsdom']
      let allInstalled = true
      
      for (const dep of requiredDeps) {
        if (deps[dep]) {
          console.log(`  ✅ ${dep} - v${deps[dep]}`)
        } else {
          console.log(`  ❌ ${dep} - NOT INSTALLED`)
          allInstalled = false
        }
      }

      this.testResults.push({
        test: 'Security Dependencies',
        passed: allInstalled,
        details: `${requiredDeps.filter(d => deps[d]).length}/${requiredDeps.length} dependencies installed`
      })
    } catch (error) {
      console.log('  ❌ Error reading package.json')
      this.testResults.push({
        test: 'Security Dependencies',
        passed: false,
        details: 'Could not read package.json'
      })
    }
  }

  // Test secured API routes
  testSecuredRoutes() {
    console.log('\n🔍 Testing secured API routes...')
    
    const securedRoutes = [
      'app/api/talent/profile/route.ts',
      'app/api/talent/epk/upload/route.ts',
      'app/api/bookings/create/route.ts',
      'app/api/messages/route.ts',
      'app/api/talent/packages/route.ts'
    ]

    let securedCount = 0
    for (const route of securedRoutes) {
      if (fs.existsSync(route)) {
        const content = fs.readFileSync(route, 'utf8')
        if (content.includes('withSecurity') || content.includes('withValidation') || content.includes('withFileUploadSecurity')) {
          console.log(`  ✅ ${route} - SECURED`)
          securedCount++
        } else {
          console.log(`  ❌ ${route} - NOT SECURED`)
        }
      } else {
        console.log(`  ❌ ${route} - FILE NOT FOUND`)
      }
    }

    this.testResults.push({
      test: 'Secured API Routes',
      passed: securedCount === securedRoutes.length,
      details: `${securedCount}/${securedRoutes.length} routes properly secured`
    })
  }

  // Test validation schemas
  testValidationSchemas() {
    console.log('\n🔍 Testing validation schemas...')
    
    try {
      const validationFile = 'lib/security/validation.ts'
      if (fs.existsSync(validationFile)) {
        const content = fs.readFileSync(validationFile, 'utf8')
        
        const requiredSchemas = [
          'userInputSchemas.profile',
          'userInputSchemas.booking', 
          'userInputSchemas.message',
          'userInputSchemas.package',
          'userInputSchemas.review'
        ]

        let schemasFound = 0
        for (const schema of requiredSchemas) {
          if (content.includes(schema.split('.')[1] + ':')) {
            console.log(`  ✅ ${schema}`)
            schemasFound++
          } else {
            console.log(`  ❌ ${schema} - NOT FOUND`)
          }
        }

        this.testResults.push({
          test: 'Validation Schemas',
          passed: schemasFound === requiredSchemas.length,
          details: `${schemasFound}/${requiredSchemas.length} schemas defined`
        })
      } else {
        console.log('  ❌ Validation file not found')
        this.testResults.push({
          test: 'Validation Schemas',
          passed: false,
          details: 'Validation file missing'
        })
      }
    } catch (error) {
      console.log('  ❌ Error reading validation file')
      this.testResults.push({
        test: 'Validation Schemas',
        passed: false,
        details: 'Error reading validation file'
      })
    }
  }

  // Test security components
  testSecurityComponents() {
    console.log('\n🔍 Testing security components...')
    
    try {
      const componentFile = 'components/security/SecureContent.tsx'
      if (fs.existsSync(componentFile)) {
        const content = fs.readFileSync(componentFile, 'utf8')
        
        const requiredComponents = [
          'SecureContent',
          'SecureInput',
          'SecureTextarea', 
          'SecureFileInput',
          'useSecureForm'
        ]

        let componentsFound = 0
        for (const component of requiredComponents) {
          if (content.includes(`export function ${component}`) || content.includes(`export const ${component}`)) {
            console.log(`  ✅ ${component}`)
            componentsFound++
          } else {
            console.log(`  ❌ ${component} - NOT FOUND`)
          }
        }

        this.testResults.push({
          test: 'Security Components',
          passed: componentsFound === requiredComponents.length,
          details: `${componentsFound}/${requiredComponents.length} components implemented`
        })
      } else {
        console.log('  ❌ Security components file not found')
        this.testResults.push({
          test: 'Security Components',
          passed: false,
          details: 'Security components file missing'
        })
      }
    } catch (error) {
      console.log('  ❌ Error reading security components file')
      this.testResults.push({
        test: 'Security Components',
        passed: false,
        details: 'Error reading security components file'
      })
    }
  }

  // Generate test report
  generateReport() {
    console.log('\n📊 Security Implementation Test Report')
    console.log('=====================================\n')
    
    const passed = this.testResults.filter(r => r.passed).length
    const total = this.testResults.length
    const percentage = Math.round((passed / total) * 100)
    
    console.log(`Overall Score: ${passed}/${total} tests passed (${percentage}%)\n`)
    
    for (const result of this.testResults) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL'
      console.log(`${status} - ${result.test}`)
      console.log(`       ${result.details}\n`)
    }
    
    if (percentage === 100) {
      console.log('🎉 All security tests passed! Implementation is ready.')
    } else if (percentage >= 80) {
      console.log('⚠️  Most security tests passed. Address failing tests before deployment.')
    } else {
      console.log('🚨 Multiple security tests failed. Complete implementation before proceeding.')
    }
    
    console.log('\n📋 Next Steps:')
    console.log('─'.repeat(12))
    if (percentage < 100) {
      console.log('1. Fix failing tests')
      console.log('2. Re-run security test')
    }
    console.log('3. Run security audit: node scripts/security-audit.js')
    console.log('4. Apply bulk security updates: node scripts/apply-security-bulk.js')
    console.log('5. Test application functionality')
  }

  // Run all tests
  async runTests() {
    console.log('🛡️  Testing Gig-Secure Security Implementation\n')
    
    this.testSecurityFiles()
    this.testDependencies()
    this.testSecuredRoutes()
    this.testValidationSchemas()
    this.testSecurityComponents()
    
    this.generateReport()
  }
}

// Run the tests
if (require.main === module) {
  const tester = new SecurityTester()
  tester.runTests().catch(console.error)
}

module.exports = SecurityTester
