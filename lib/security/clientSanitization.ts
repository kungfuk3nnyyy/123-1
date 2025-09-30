
// Client-side sanitization utilities
// Note: This runs in the browser, so we use a different approach than server-side

// HTML encoding for client-side use
export function encodeHTML(str: string): string {
  if (!str || typeof str !== 'string') return ''
  
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// Decode HTML entities
export function decodeHTML(str: string): string {
  if (!str || typeof str !== 'string') return ''
  
  const div = document.createElement('div')
  div.innerHTML = str
  return div.textContent || div.innerText || ''
}

// Sanitize text input on client side
export function sanitizeTextInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000) // Limit length
}

// Sanitize search queries
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return ''
  
  return query
    .trim()
    .replace(/[<>'"&]/g, '')
    .replace(/[^\w\s-]/g, '') // Only allow word characters, spaces, and hyphens
    .substring(0, 100)
}

// Validate and sanitize URLs
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') return ''
  
  try {
    const parsedURL = new URL(url)
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsedURL.protocol)) {
      return ''
    }
    
    return parsedURL.toString()
  } catch {
    return ''
  }
}

// Sanitize file names for display
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') return 'unnamed_file'
  
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 255)
    || 'unnamed_file'
}

// Validate email format
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

// Validate phone number format
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  
  const phoneRegex = /^\+?[\d\s-()]{10,15}$/
  return phoneRegex.test(phone.trim())
}

// Sanitize form data before submission
export function sanitizeFormData(formData: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeTextInput(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeTextInput(item) : item
      )
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

// Content Security Policy helpers for client-side
export function createSecureScriptElement(src: string, nonce?: string): HTMLScriptElement | null {
  try {
    const url = new URL(src)
    if (!['http:', 'https:'].includes(url.protocol)) {
      console.warn('Blocked script with invalid protocol:', src)
      return null
    }
    
    const script = document.createElement('script')
    script.src = src
    if (nonce) {
      script.nonce = nonce
    }
    return script
  } catch {
    console.warn('Blocked script with invalid URL:', src)
    return null
  }
}

// Safe innerHTML replacement
export function safeSetInnerHTML(element: HTMLElement, html: string): void {
  // Create a temporary container
  const temp = document.createElement('div')
  temp.innerHTML = html
  
  // Remove all script tags and event handlers
  const scripts = temp.querySelectorAll('script')
  scripts.forEach(script => script.remove())
  
  // Remove event handler attributes
  const allElements = temp.querySelectorAll('*')
  allElements.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name)
      }
    })
  })
  
  // Set the cleaned HTML
  element.innerHTML = temp.innerHTML
}

// Validate file before upload
export function validateFileForUpload(
  file: File,
  config: {
    maxSize: number
    allowedTypes: string[]
    maxNameLength?: number
  }
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' }
  }
  
  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024))
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` }
  }
  
  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type not allowed. Allowed types: ${config.allowedTypes.join(', ')}` }
  }
  
  // Check filename length
  const maxNameLength = config.maxNameLength || 255
  if (file.name.length > maxNameLength) {
    return { valid: false, error: `Filename too long (max ${maxNameLength} characters)` }
  }
  
  // Check for dangerous extensions
  const fileName = file.name.toLowerCase()
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar', '.vbs', '.js', '.php']
  
  if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
    return { valid: false, error: 'File type not allowed for security reasons' }
  }
  
  return { valid: true }
}

// Rate limiting for client-side API calls
class ClientRateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  canMakeRequest(endpoint: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    if (!this.requests.has(endpoint)) {
      this.requests.set(endpoint, [])
    }
    
    const endpointRequests = this.requests.get(endpoint)!
    
    // Remove old requests outside the window
    const validRequests = endpointRequests.filter(time => time > windowStart)
    
    if (validRequests.length >= maxRequests) {
      return false
    }
    
    // Add current request
    validRequests.push(now)
    this.requests.set(endpoint, validRequests)
    
    return true
  }
  
  getRemainingRequests(endpoint: string, maxRequests: number = 10, windowMs: number = 60000): number {
    const now = Date.now()
    const windowStart = now - windowMs
    
    if (!this.requests.has(endpoint)) {
      return maxRequests
    }
    
    const endpointRequests = this.requests.get(endpoint)!
    const validRequests = endpointRequests.filter(time => time > windowStart)
    
    return Math.max(0, maxRequests - validRequests.length)
  }
}

export const rateLimiter = new ClientRateLimiter()

// Secure API request helper
export async function secureApiRequest(
  url: string,
  options: RequestInit = {},
  rateLimitConfig?: { maxRequests: number; windowMs: number }
): Promise<Response> {
  // Check rate limiting
  if (rateLimitConfig && !rateLimiter.canMakeRequest(url, rateLimitConfig.maxRequests, rateLimitConfig.windowMs)) {
    throw new Error('Rate limit exceeded. Please try again later.')
  }
  
  // Sanitize URL
  const sanitizedUrl = sanitizeURL(url)
  if (!sanitizedUrl) {
    throw new Error('Invalid URL')
  }
  
  // Add security headers
  const secureOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers,
    },
  }
  
  // Sanitize request body if it's JSON
  if (secureOptions.body && typeof secureOptions.body === 'string') {
    try {
      const parsedBody = JSON.parse(secureOptions.body)
      const sanitizedBody = sanitizeFormData(parsedBody)
      secureOptions.body = JSON.stringify(sanitizedBody)
    } catch {
      // If it's not JSON, leave it as is
    }
  }
  
  return fetch(sanitizedUrl, secureOptions)
}

// Input validation helpers
export const validators = {
  required: (value: any) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required'
    }
    return null
  },
  
  email: (value: string) => {
    if (!isValidEmail(value)) {
      return 'Please enter a valid email address'
    }
    return null
  },
  
  minLength: (min: number) => (value: string) => {
    if (typeof value === 'string' && value.length < min) {
      return `Must be at least ${min} characters long`
    }
    return null
  },
  
  maxLength: (max: number) => (value: string) => {
    if (typeof value === 'string' && value.length > max) {
      return `Must be no more than ${max} characters long`
    }
    return null
  },
  
  numeric: (value: string) => {
    if (isNaN(Number(value))) {
      return 'Must be a valid number'
    }
    return null
  },
  
  positiveNumber: (value: string) => {
    const num = Number(value)
    if (isNaN(num) || num <= 0) {
      return 'Must be a positive number'
    }
    return null
  },
  
  url: (value: string) => {
    if (!sanitizeURL(value)) {
      return 'Please enter a valid URL'
    }
    return null
  },
  
  phone: (value: string) => {
    if (!isValidPhone(value)) {
      return 'Please enter a valid phone number'
    }
    return null
  }
}

// Form validation helper
export function validateForm(
  formData: Record<string, any>,
  validationRules: Record<string, Array<(value: any) => string | null>>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  
  for (const [field, rules] of Object.entries(validationRules)) {
    const value = formData[field]
    
    for (const rule of rules) {
      const error = rule(value)
      if (error) {
        errors[field] = error
        break // Stop at first error for this field
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
