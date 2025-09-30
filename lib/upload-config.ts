
import path from 'path'
import { UploadConfig } from './upload'

// Enhanced upload configurations for different file types
export const UPLOAD_CONFIGS = {
  KYC: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf'
    ],
    uploadDir: path.join(process.cwd(), 'uploads', 'kyc'),
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
    minFileSize: 10 * 1024, // 10KB minimum
    maxFiles: 3 // Maximum files per submission
  } as UploadConfig & { 
    allowedExtensions: string[]
    minFileSize: number
    maxFiles: number
  },

  PROFILE: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png'
    ],
    uploadDir: path.join(process.cwd(), 'uploads', 'profiles'),
    allowedExtensions: ['.jpg', '.jpeg', '.png'],
    minFileSize: 1 * 1024, // 1KB minimum
    maxFiles: 1
  } as UploadConfig & { 
    allowedExtensions: string[]
    minFileSize: number
    maxFiles: number
  },

  PORTFOLIO: {
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf',
      'video/mp4',
      'video/quicktime'
    ],
    uploadDir: path.join(process.cwd(), 'uploads', 'portfolio'),
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf', '.mp4', '.mov'],
    minFileSize: 1 * 1024, // 1KB minimum
    maxFiles: 10
  } as UploadConfig & { 
    allowedExtensions: string[]
    minFileSize: number
    maxFiles: number
  }
}

// Security settings
export const SECURITY_CONFIG = {
  // File name sanitization
  sanitizeFileNames: true,
  
  // Virus scanning (placeholder for future implementation)
  enableVirusScanning: false,
  
  // Image processing (placeholder for future implementation)
  processImages: true,
  
  // Generate thumbnails for images
  generateThumbnails: true,
  
  // Watermark images (for portfolio items)
  watermarkImages: false,
  
  // File encryption at rest
  encryptFiles: false,
  
  // Maximum concurrent uploads per user
  maxConcurrentUploads: 3,
  
  // Rate limiting
  uploadRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxUploads: 10 // Maximum uploads per window
  }
}

// File type validation helpers
export const FILE_VALIDATION = {
  // MIME type to extension mapping
  mimeToExtension: {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'application/pdf': '.pdf',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov'
  } as { [key: string]: string },

  // Dangerous file extensions to always reject
  dangerousExtensions: [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.php', '.asp', '.aspx', '.jsp', '.sh', '.py', '.rb', '.pl'
  ],

  // Magic number validation for common file types
  magicNumbers: {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'application/pdf': [0x25, 0x50, 0x44, 0x46]
  } as { [key: string]: number[] }
}

// Storage paths
export const STORAGE_PATHS = {
  KYC: '/uploads/kyc',
  PROFILE: '/uploads/profiles', 
  PORTFOLIO: '/uploads/portfolio',
  TEMP: '/uploads/temp'
}

// URL generation helpers
export function generateFileUrl(category: keyof typeof STORAGE_PATHS, fileName: string): string {
  return `${STORAGE_PATHS[category]}/${fileName}`
}

export function getUploadConfig(category: keyof typeof UPLOAD_CONFIGS): typeof UPLOAD_CONFIGS[keyof typeof UPLOAD_CONFIGS] {
  return UPLOAD_CONFIGS[category]
}
