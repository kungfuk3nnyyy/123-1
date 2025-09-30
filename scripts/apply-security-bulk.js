
const fs = require('fs')
const path = require('path')

// Bulk security application script
class SecurityBulkUpdater {
  constructor() {
    this.updatedFiles = []
    this.errors = []
  }

  // Get all API route files
  findApiRoutes(dir = './app/api') {
    const routes = []
    const files = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name)
      
      if (file.isDirectory()) {
        routes.push(...this.findApiRoutes(fullPath))
      } else if (file.name === 'route.ts') {
        routes.push(fullPath)
      }
    }
    
    return routes
  }

  // Check if file already has security middleware
  hasSecurityMiddleware(content) {
    return content.includes('withSecurity') || 
           content.includes('withValidation') || 
           content.includes('withFileUploadSecurity')
  }

  // Determine appropriate security middleware based on content
  getSecurityMiddleware(content) {
    if (content.includes('request.formData()') && content.includes('File')) {
      return 'withFileUploadSecurity'
    } else if (content.includes('request.json()')) {
      return 'withValidation'
    } else {
      return 'withSecurity'
    }
  }

  // Get appropriate validation schema
  getValidationSchema(content, method) {
    if (content.includes('booking') || content.includes('Booking')) {
      return 'userInputSchemas.booking'
    } else if (content.includes('message') || content.includes('Message')) {
      return 'userInputSchemas.message'
    } else if (content.includes('package') || content.includes('Package')) {
      return 'userInputSchemas.package'
    } else if (content.includes('profile') || content.includes('Profile')) {
      return 'userInputSchemas.profile'
    } else if (content.includes('review') || content.includes('Review')) {
      return 'userInputSchemas.review'
    } else if (content.includes('availability') || content.includes('Availability')) {
      return 'userInputSchemas.availability'
    } else {
      // Generic validation for unknown types
      return 'z.object({ /* Add appropriate schema */ })'
    }
  }

  // Add security imports to file
  addSecurityImports(content) {
    const imports = [
      "import { withSecurity, withValidation, withFileUploadSecurity } from '@/lib/security/middleware'",
      "import { userInputSchemas, validateInput } from '@/lib/security/validation'",
      "import { sanitizeUserInput } from '@/lib/security/sanitization'"
    ]

    // Find the last import statement
    const lines = content.split('\n')
    let lastImportIndex = -1
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') && !lines[i].includes('@/lib/security')) {
        lastImportIndex = i
      }
    }

    if (lastImportIndex !== -1) {
      // Insert security imports after the last import
      lines.splice(lastImportIndex + 1, 0, '', ...imports)
      return lines.join('\n')
    } else {
      // If no imports found, add at the beginning
      return imports.join('\n') + '\n\n' + content
    }
  }

  // Convert function to use security middleware
  secureFunction(content, functionName, method) {
    const middlewareType = this.getSecurityMiddleware(content)
    const schema = this.getValidationSchema(content, method)

    // Replace export async function with handler function
    const handlerName = `${method.toLowerCase()}Handler`
    content = content.replace(
      `export async function ${method}(`,
      `const ${handlerName} = async (`
    )

    // Add export with middleware at the end
    let middlewareCall
    if (middlewareType === 'withValidation') {
      middlewareCall = `export const ${method} = withValidation(${schema})(${handlerName});`
    } else if (middlewareType === 'withFileUploadSecurity') {
      middlewareCall = `export const ${method} = withFileUploadSecurity({
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
    'application/pdf', 'text/plain'
  ],
  maxFiles: 10
})(${handlerName});`
    } else {
      middlewareCall = `export const ${method} = withSecurity({
  rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 },
  sanitizeInput: true,
  allowedMethods: ['${method}']
})(${handlerName});`
    }

    // Add middleware export at the end
    content += '\n\n' + middlewareCall

    return content
  }

  // Add input validation to handler
  addInputValidation(content, method) {
    if (!content.includes('request.json()')) {
      return content
    }

    const validationCode = `
    let requestData;
    try {
      requestData = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON data' }, { status: 400 })
    }

    // Validate and sanitize input data
    try {
      requestData = validateInput(${this.getValidationSchema(content, method)}, requestData);
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sanitize all string inputs
    requestData = sanitizeUserInput(requestData);`

    // Replace the request.json() call
    content = content.replace(
      /const\s+(\w+)\s+=\s+await\s+request\.json\(\)/g,
      validationCode + '\n    const $1 = requestData'
    )

    return content
  }

  // Update a single API route file
  updateApiRoute(filePath) {
    try {
      console.log(`Processing: ${filePath}`)
      
      let content = fs.readFileSync(filePath, 'utf8')
      
      // Skip if already has security middleware
      if (this.hasSecurityMiddleware(content)) {
        console.log(`  ✓ Already secured`)
        return
      }

      // Add security imports
      content = this.addSecurityImports(content)

      // Find and secure HTTP methods
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      let hasChanges = false

      for (const method of methods) {
        const regex = new RegExp(`export async function ${method}\\(`, 'g')
        if (regex.test(content)) {
          content = this.secureFunction(content, method, method)
          content = this.addInputValidation(content, method)
          hasChanges = true
        }
      }

      if (hasChanges) {
        // Write the updated content back to file
        fs.writeFileSync(filePath, content, 'utf8')
        this.updatedFiles.push(filePath)
        console.log(`  ✅ Updated successfully`)
      } else {
        console.log(`  ⚠️  No HTTP methods found`)
      }

    } catch (error) {
      console.error(`  ❌ Error updating ${filePath}:`, error.message)
      this.errors.push({ file: filePath, error: error.message })
    }
  }

  // Update all API routes
  async updateAllRoutes() {
    console.log('🔒 Starting bulk security update...\n')
    
    const routes = this.findApiRoutes()
    console.log(`Found ${routes.length} API routes to process\n`)

    for (const route of routes) {
      this.updateApiRoute(route)
    }

    this.generateReport()
  }

  // Generate update report
  generateReport() {
    console.log('\n📊 Bulk Security Update Report')
    console.log('================================\n')
    
    console.log(`✅ Successfully Updated: ${this.updatedFiles.length} files`)
    console.log(`❌ Errors: ${this.errors.length} files\n`)

    if (this.updatedFiles.length > 0) {
      console.log('Updated Files:')
      console.log('─'.repeat(14))
      this.updatedFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`)
      })
      console.log('')
    }

    if (this.errors.length > 0) {
      console.log('Errors:')
      console.log('─'.repeat(7))
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.file}`)
        console.log(`   Error: ${error.error}\n`)
      })
    }

    console.log('📋 Next Steps:')
    console.log('─'.repeat(12))
    console.log('1. Review updated files for correctness')
    console.log('2. Add appropriate validation schemas where needed')
    console.log('3. Test all endpoints with the new security middleware')
    console.log('4. Run security audit again to verify improvements')
    console.log('5. Update any files that had errors manually\n')

    console.log('🔍 Run security audit:')
    console.log('node scripts/security-audit.js\n')
  }
}

// Run the bulk updater
if (require.main === module) {
  const updater = new SecurityBulkUpdater()
  updater.updateAllRoutes().catch(console.error)
}

module.exports = SecurityBulkUpdater
