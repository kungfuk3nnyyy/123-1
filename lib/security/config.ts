
// Security configuration for the application

export const securityConfig = {
  // Rate limiting configurations
  rateLimits: {
    // API endpoints
    api: {
      requests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    
    // Authentication endpoints
    auth: {
      requests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    
    // File upload endpoints
    fileUpload: {
      requests: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    
    // Public endpoints
    public: {
      requests: 50,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    
    // Search endpoints
    search: {
      requests: 30,
      windowMs: 5 * 60 * 1000, // 5 minutes
    }
  },
  
  // File upload configurations
  fileUpload: {
    // Maximum file sizes (in bytes)
    maxSizes: {
      image: 5 * 1024 * 1024, // 5MB
      document: 10 * 1024 * 1024, // 10MB
      video: 100 * 1024 * 1024, // 100MB
      audio: 50 * 1024 * 1024, // 50MB
      general: 25 * 1024 * 1024, // 25MB
    },
    
    // Allowed MIME types
    allowedTypes: {
      images: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ],
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ],
      videos: [
        'video/mp4',
        'video/mov',
        'video/avi',
        'video/quicktime',
        'video/webm'
      ],
      audio: [
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/mp4'
      ]
    },
    
    // Dangerous file extensions to block
    blockedExtensions: [
      '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar',
      '.vbs', '.js', '.php', '.asp', '.aspx', '.jsp', '.sh',
      '.ps1', '.msi', '.deb', '.rpm', '.dmg', '.app'
    ]
  },
  
  // Input validation configurations
  validation: {
    // String length limits
    stringLimits: {
      short: 255,
      medium: 1000,
      long: 5000,
      veryLong: 10000
    },
    
    // Array size limits
    arrayLimits: {
      small: 10,
      medium: 50,
      large: 100
    },
    
    // Numeric limits
    numericLimits: {
      currency: {
        min: 0,
        max: 1000000
      },
      rating: {
        min: 1,
        max: 5
      },
      percentage: {
        min: 0,
        max: 100
      }
    }
  },
  
  // Content Security Policy settings
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  
  // Session and authentication settings
  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    passwordMinLength: 8,
    requireStrongPassword: true
  },
  
  // Logging and monitoring
  logging: {
    logSecurityEvents: true,
    logFailedAttempts: true,
    logFileUploads: true,
    logSuspiciousActivity: true
  },
  
  // Environment-specific settings
  development: {
    strictValidation: false,
    verboseLogging: true,
    allowTestData: true
  },
  
  production: {
    strictValidation: true,
    verboseLogging: false,
    allowTestData: false,
    enforceHTTPS: true,
    enableHSTS: true
  }
}

// Get environment-specific configuration
export function getSecurityConfig() {
  const baseConfig = { ...securityConfig }
  const env = process.env.NODE_ENV || 'development'
  
  if (env === 'production') {
    return {
      ...baseConfig,
      ...baseConfig.production
    }
  }
  
  return {
    ...baseConfig,
    ...baseConfig.development
  }
}

// Security headers configuration
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// Production-only headers
export const productionHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Expect-CT': 'max-age=86400, enforce'
}
