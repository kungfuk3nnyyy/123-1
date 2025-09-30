
import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// Create a DOMPurify instance for server-side use
const window = new JSDOM('').window
const purify = DOMPurify(window as any)

// Configure DOMPurify with strict settings
purify.setConfig({
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'
  ],
  ALLOWED_ATTR: ['class'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SANITIZE_DOM: true,
  SANITIZE_NAMED_PROPS: true,
  KEEP_CONTENT: false,
  IN_PLACE: false,
})

// Sanitization functions
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return ''
  }
  
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'
    ],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false,
  })
}

export function sanitizeText(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return ''
  }
  
  // Strip all HTML tags and return plain text
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}

export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }
  
  try {
    const parsedUrl = new URL(url)
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return ''
    }
    
    return parsedUrl.toString()
  } catch {
    return ''
  }
}

export function sanitizeUserInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeText(input)
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeUserInput)
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      // Sanitize the key as well
      const cleanKey = sanitizeText(key)
      if (cleanKey) {
        sanitized[cleanKey] = sanitizeUserInput(value)
      }
    }
    return sanitized
  }
  
  return input
}

// Rich text sanitization for user content that should preserve some formatting
export function sanitizeRichText(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return ''
  }
  
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 
      'h3', 'h4', 'h5', 'h6', 'blockquote', 'a'
    ],
    ALLOWED_ATTR: {
      'a': ['href', 'title'],
      '*': ['class']
    },
    ALLOWED_URI_REGEXP: /^https?:\/\//,
    ALLOW_DATA_ATTR: false,
  })
}

// Sanitize search queries
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return ''
  }
  
  return query
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .substring(0, 100) // Limit length
}

// Sanitize file names for uploads
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'unnamed_file'
  }
  
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 255) // Limit length
    || 'unnamed_file' // Fallback if empty after sanitization
}

// Content Security Policy helpers
export function generateCSPNonce(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(16).toString('base64')
}

export function buildCSPHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
}

// Input encoding for different contexts
export function encodeForHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function encodeForHTMLAttribute(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export function encodeForJavaScript(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
}
