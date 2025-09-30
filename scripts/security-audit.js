
const fs = require('fs')
const path = require('path')

// Security audit script for the Gig-Secure application
class SecurityAuditor {
  constructor() {
    this.issues = []
    this.apiRoutes = []
    this.components = []
  }

  // Find all API routes
  findApiRoutes(dir = './app/api') {
    const files = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name)
      
      if (file.isDirectory()) {
        this.findApiRoutes(fullPath)
      } else if (file.name === 'route.ts' || file.name === 'route.js') {
        this.apiRoutes.push(fullPath)
      }
    }
  }

  // Find all React components
  findComponents(dir = './components') {
    if (!fs.existsSync(dir)) return
    
    const files = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name)
      
      if (file.isDirectory()) {
        this.findComponents(fullPath)
      } else if (file.name.endsWith('.tsx') || file.name.endsWith('.jsx')) {
        this.components.push(fullPath)
      }
    }
  }

  // Check for input validation in API routes
  checkInputValidation() {
    console.log('🔍 Checking input validation in API routes...')
    
    for (const route of this.apiRoutes) {
      const content = fs.readFileSync(route, 'utf8')
      
      // Check if route uses request.json() without validation
      if (content.includes('request.json()') && !content.includes('validateInput') && !content.includes('withValidation')) {
        this.issues.push({
          type: 'INPUT_VALIDATION',
          severity: 'HIGH',
          file: route,
          message: 'API route accepts JSON input without proper validation'
        })
      }
      
      // Check if route uses formData without validation
      if (content.includes('request.formData()') && !content.includes('withFileUploadSecurity') && !content.includes('validateFile')) {
        this.issues.push({
          type: 'FILE_UPLOAD_VALIDATION',
          severity: 'HIGH',
          file: route,
          message: 'API route handles file uploads without proper security validation'
        })
      }
      
      // Check for SQL injection vulnerabilities (raw queries)
      if (content.includes('prisma.$queryRaw') || content.includes('prisma.$executeRaw')) {
        this.issues.push({
          type: 'SQL_INJECTION',
          severity: 'CRITICAL',
          file: route,
          message: 'API route uses raw SQL queries which may be vulnerable to injection'
        })
      }
      
      // Check for missing authentication
      if ((content.includes('export async function POST') || content.includes('export async function PUT') || content.includes('export async function DELETE')) 
          && !content.includes('getServerSession') && !content.includes('withAuth')) {
        this.issues.push({
          type: 'MISSING_AUTH',
          severity: 'HIGH',
          file: route,
          message: 'API route modifies data without authentication check'
        })
      }
      
      // Check for missing rate limiting
      if (!content.includes('withSecurity') && !content.includes('rateLimit')) {
        this.issues.push({
          type: 'MISSING_RATE_LIMIT',
          severity: 'MEDIUM',
          file: route,
          message: 'API route lacks rate limiting protection'
        })
      }
    }
  }

  // Check for XSS vulnerabilities in components
  checkXSSVulnerabilities() {
    console.log('🔍 Checking for XSS vulnerabilities in components...')
    
    for (const component of this.components) {
      const content = fs.readFileSync(component, 'utf8')
      
      // Check for dangerouslySetInnerHTML usage
      if (content.includes('dangerouslySetInnerHTML')) {
        this.issues.push({
          type: 'XSS_VULNERABILITY',
          severity: 'HIGH',
          file: component,
          message: 'Component uses dangerouslySetInnerHTML which may be vulnerable to XSS'
        })
      }
      
      // Check for direct innerHTML usage
      if (content.includes('.innerHTML')) {
        this.issues.push({
          type: 'XSS_VULNERABILITY',
          severity: 'HIGH',
          file: component,
          message: 'Component directly manipulates innerHTML which may be vulnerable to XSS'
        })
      }
      
      // Check for unsanitized user input rendering
      if (content.includes('{user.') && !content.includes('sanitize') && !content.includes('SecureContent')) {
        this.issues.push({
          type: 'UNSANITIZED_OUTPUT',
          severity: 'MEDIUM',
          file: component,
          message: 'Component may render unsanitized user input'
        })
      }
    }
  }

  // Check security configuration
  checkSecurityConfig() {
    console.log('🔍 Checking security configuration...')
    
    // Check if security middleware is configured
    if (!fs.existsSync('./lib/security/middleware.ts')) {
      this.issues.push({
        type: 'MISSING_SECURITY_MIDDLEWARE',
        severity: 'HIGH',
        file: 'lib/security/middleware.ts',
        message: 'Security middleware not found'
      })
    }
    
    // Check if sanitization utilities exist
    if (!fs.existsSync('./lib/security/sanitization.ts')) {
      this.issues.push({
        type: 'MISSING_SANITIZATION',
        severity: 'HIGH',
        file: 'lib/security/sanitization.ts',
        message: 'Sanitization utilities not found'
      })
    }
    
    // Check environment variables
    if (!process.env.NEXTAUTH_SECRET) {
      this.issues.push({
        type: 'MISSING_ENV_VAR',
        severity: 'CRITICAL',
        file: '.env',
        message: 'NEXTAUTH_SECRET environment variable not set'
      })
    }
    
    // Check if HTTPS is enforced in production
    if (process.env.NODE_ENV === 'production' && !process.env.FORCE_HTTPS) {
      this.issues.push({
        type: 'MISSING_HTTPS_ENFORCEMENT',
        severity: 'HIGH',
        file: 'production config',
        message: 'HTTPS not enforced in production environment'
      })
    }
  }

  // Check dependencies for known vulnerabilities
  checkDependencies() {
    console.log('🔍 Checking dependencies...')
    
    if (fs.existsSync('./package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      // Check for known vulnerable packages (this is a simplified check)
      const vulnerablePackages = {
        'lodash': '< 4.17.21',
        'axios': '< 0.21.2',
        'node-fetch': '< 2.6.7'
      }
      
      for (const [pkg, vulnerableVersion] of Object.entries(vulnerablePackages)) {
        if (dependencies[pkg]) {
          this.issues.push({
            type: 'VULNERABLE_DEPENDENCY',
            severity: 'MEDIUM',
            file: 'package.json',
            message: `Package ${pkg} may have known vulnerabilities. Please update to latest version.`
          })
        }
      }
    }
  }

  // Generate security report
  generateReport() {
    console.log('\n📊 Security Audit Report')
    console.log('========================\n')
    
    if (this.issues.length === 0) {
      console.log('✅ No security issues found!')
      return
    }
    
    // Group issues by severity
    const critical = this.issues.filter(i => i.severity === 'CRITICAL')
    const high = this.issues.filter(i => i.severity === 'HIGH')
    const medium = this.issues.filter(i => i.severity === 'MEDIUM')
    const low = this.issues.filter(i => i.severity === 'LOW')
    
    console.log(`🚨 Critical Issues: ${critical.length}`)
    console.log(`⚠️  High Issues: ${high.length}`)
    console.log(`⚡ Medium Issues: ${medium.length}`)
    console.log(`ℹ️  Low Issues: ${low.length}\n`)
    
    // Display issues by severity
    const displayIssues = (issues, title) => {
      if (issues.length === 0) return
      
      console.log(`${title}:`)
      console.log('─'.repeat(title.length + 1))
      
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type}`)
        console.log(`   File: ${issue.file}`)
        console.log(`   Message: ${issue.message}\n`)
      })
    }
    
    displayIssues(critical, '🚨 CRITICAL ISSUES')
    displayIssues(high, '⚠️  HIGH PRIORITY ISSUES')
    displayIssues(medium, '⚡ MEDIUM PRIORITY ISSUES')
    displayIssues(low, 'ℹ️  LOW PRIORITY ISSUES')
    
    // Summary and recommendations
    console.log('📋 Recommendations:')
    console.log('─'.repeat(17))
    console.log('1. Address all CRITICAL and HIGH priority issues immediately')
    console.log('2. Implement input validation on all API endpoints')
    console.log('3. Add output sanitization for all user-generated content')
    console.log('4. Enable rate limiting on all public endpoints')
    console.log('5. Regular security audits and dependency updates')
    console.log('6. Implement Content Security Policy (CSP)')
    console.log('7. Use HTTPS in production with proper security headers\n')
  }

  // Run complete audit
  async runAudit() {
    console.log('🛡️  Starting Security Audit for Gig-Secure Application\n')
    
    this.findApiRoutes()
    this.findComponents()
    
    console.log(`Found ${this.apiRoutes.length} API routes`)
    console.log(`Found ${this.components.length} components\n`)
    
    this.checkInputValidation()
    this.checkXSSVulnerabilities()
    this.checkSecurityConfig()
    this.checkDependencies()
    
    this.generateReport()
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new SecurityAuditor()
  auditor.runAudit().catch(console.error)
}

module.exports = SecurityAuditor
