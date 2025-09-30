
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateInput } from './validation'
import { sanitizeUserInput, generateCSPNonce, buildCSPHeader } from './sanitization'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security middleware wrapper
export function withSecurity(options: {
  rateLimit?: { requests: number; windowMs: number }
  requireAuth?: boolean
  sanitizeInput?: boolean
  validateSchema?: z.ZodSchema<any>
  allowedMethods?: string[]
} = {}) {
  return function securityMiddleware(handler: Function) {
    return async function securedHandler(request: NextRequest) {
      try {
        // Method validation
        if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
          return NextResponse.json(
            { error: 'Method not allowed' },
            { status: 405 }
          )
        }

        // Rate limiting
        if (options.rateLimit) {
          const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
          const rateLimitResult = checkRateLimit(clientIP, options.rateLimit)
          
          if (!rateLimitResult.allowed) {
            return NextResponse.json(
              { error: 'Too many requests' },
              { 
                status: 429,
                headers: {
                  'Retry-After': Math.ceil(rateLimitResult.resetTime / 1000).toString()
                }
              }
            )
          }
        }

        // Input validation and sanitization
        let requestData: any = null
        
        if (request.method !== 'GET' && request.method !== 'DELETE') {
          try {
            const contentType = request.headers.get('content-type') || ''
            
            if (contentType.includes('application/json')) {
              requestData = await request.json()
            } else if (contentType.includes('multipart/form-data')) {
              requestData = await request.formData()
            }
            
            // Sanitize input if enabled
            if (options.sanitizeInput && requestData) {
              requestData = sanitizeUserInput(requestData)
            }
            
            // Validate against schema if provided
            if (options.validateSchema && requestData) {
              requestData = validateInput(options.validateSchema, requestData)
            }
            
          } catch (error) {
            return NextResponse.json(
              { error: 'Invalid request data' },
              { status: 400 }
            )
          }
        }

        // Create enhanced request object
        const enhancedRequest = Object.assign(request, {
          validatedData: requestData,
          clientIP: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
        })

        // Call the original handler
        const response = await handler(enhancedRequest)

        // Add security headers to response
        if (response instanceof NextResponse) {
          addSecurityHeaders(response)
        }

        return response

      } catch (error) {
        console.error('Security middleware error:', error)
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
    }
  }
}

// Rate limiting function
function checkRateLimit(
  clientIP: string, 
  config: { requests: number; windowMs: number }
): { allowed: boolean; resetTime: number } {
  const now = Date.now()
  const key = `rate_limit:${clientIP}`
  const existing = rateLimitStore.get(key)

  if (!existing || now > existing.resetTime) {
    // New window or expired window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return { allowed: true, resetTime: now + config.windowMs }
  }

  if (existing.count >= config.requests) {
    return { allowed: false, resetTime: existing.resetTime }
  }

  // Increment count
  rateLimitStore.set(key, {
    count: existing.count + 1,
    resetTime: existing.resetTime
  })

  return { allowed: true, resetTime: existing.resetTime }
}

// Add security headers to response
function addSecurityHeaders(response: NextResponse) {
  const nonce = generateCSPNonce()
  
  response.headers.set('Content-Security-Policy', buildCSPHeader(nonce))
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // HSTS header (only for HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
}

// Validation middleware factory
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return withSecurity({
    validateSchema: schema,
    sanitizeInput: true
  })
}

// File upload security middleware
export function withFileUploadSecurity(config: {
  maxSize: number
  allowedTypes: string[]
  maxFiles?: number
}) {
  return function fileUploadMiddleware(handler: Function) {
    return async function securedFileHandler(request: NextRequest) {
      try {
        if (request.method !== 'POST') {
          return NextResponse.json(
            { error: 'Method not allowed' },
            { status: 405 }
          )
        }

        const formData = await request.formData()
        const files: File[] = []
        
        // Extract all files from form data
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            files.push(value)
          }
        }

        // Check file count
        if (config.maxFiles && files.length > config.maxFiles) {
          return NextResponse.json(
            { error: `Too many files. Maximum allowed: ${config.maxFiles}` },
            { status: 400 }
          )
        }

        // Validate each file
        for (const file of files) {
          if (file.size > config.maxSize) {
            return NextResponse.json(
              { error: `File "${file.name}" is too large. Maximum size: ${config.maxSize / (1024 * 1024)}MB` },
              { status: 400 }
            )
          }

          if (!config.allowedTypes.includes(file.type)) {
            return NextResponse.json(
              { error: `File type "${file.type}" is not allowed` },
              { status: 400 }
            )
          }

          // Additional security checks
          const fileName = file.name.toLowerCase()
          const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar', '.vbs', '.js', '.php']
          
          if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
            return NextResponse.json(
              { error: `File "${file.name}" has a dangerous extension` },
              { status: 400 }
            )
          }
        }

        // Create enhanced request with validated files
        const enhancedRequest = Object.assign(request, {
          validatedFiles: files,
          validatedFormData: formData
        })

        return await handler(enhancedRequest)

      } catch (error) {
        console.error('File upload security error:', error)
        return NextResponse.json(
          { error: 'File upload validation failed' },
          { status: 400 }
        )
      }
    }
  }
}

// Authentication middleware
export function withAuth(requiredRole?: string) {
  return withSecurity({
    requireAuth: true
  })
}

// Combined security middleware for common use cases
export const securityPresets = {
  // For API endpoints that accept JSON data
  jsonApi: withSecurity({
    rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
    sanitizeInput: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
  }),
  
  // For file upload endpoints
  fileUpload: withFileUploadSecurity({
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
      'application/pdf', 'text/plain'
    ],
    maxFiles: 10
  }),
  
  // For public endpoints with strict rate limiting
  publicApi: withSecurity({
    rateLimit: { requests: 50, windowMs: 15 * 60 * 1000 }, // 50 requests per 15 minutes
    sanitizeInput: true
  }),
  
  // For authenticated endpoints
  authenticatedApi: withSecurity({
    rateLimit: { requests: 200, windowMs: 15 * 60 * 1000 }, // 200 requests per 15 minutes
    requireAuth: true,
    sanitizeInput: true
  })
}
