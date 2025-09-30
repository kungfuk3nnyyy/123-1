
// Main security module exports
export * from './validation'
export * from './sanitization'
export * from './middleware'
export * from './fileUpload'
export * from './config'

// Re-export commonly used functions for convenience
export {
  sanitizeHtml,
  sanitizeText,
  sanitizeUserInput,
  sanitizeFileName
} from './sanitization'

export {
  validateInput,
  validateFileUpload,
  userInputSchemas,
  fileUploadSchemas,
  querySchemas
} from './validation'

export {
  withSecurity,
  withValidation,
  withFileUploadSecurity,
  securityPresets
} from './middleware'

export {
  secureFileUpload,
  uploadConfigs
} from './fileUpload'

export {
  securityConfig,
  getSecurityConfig,
  securityHeaders
} from './config'
