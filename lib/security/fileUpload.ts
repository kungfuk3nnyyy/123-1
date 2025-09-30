
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { sanitizeFileName } from './sanitization'

// File upload configuration
export interface FileUploadConfig {
  maxSize: number
  allowedTypes: string[]
  uploadPath: string
  generateUniqueName?: boolean
  preserveOriginalName?: boolean
}

// Predefined configurations
export const uploadConfigs = {
  profileImages: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    uploadPath: 'uploads/profile-images',
    generateUniqueName: true
  },
  
  epkFiles: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
      'application/pdf', 'text/plain'
    ],
    uploadPath: 'uploads/epk',
    generateUniqueName: true
  },
  
  kycDocuments: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'application/pdf'
    ],
    uploadPath: 'uploads/kyc',
    generateUniqueName: true
  },
  
  messageAttachments: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    uploadPath: 'uploads/messages',
    generateUniqueName: true
  }
}

// File upload result interface
export interface FileUploadResult {
  fileName: string
  originalName: string
  filePath: string
  fileUrl: string
  fileSize: number
  mimeType: string
  uploadedAt: Date
}

// Secure file upload function
export async function secureFileUpload(
  file: File,
  config: FileUploadConfig,
  userId?: string
): Promise<FileUploadResult> {
  // Validate file
  validateFile(file, config)
  
  // Create upload directory
  const uploadDir = path.join(process.cwd(), config.uploadPath)
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }
  
  // Generate secure filename
  const fileName = generateSecureFileName(file, config, userId)
  const filePath = path.join(uploadDir, fileName)
  
  // Write file to disk
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)
  
  // Generate public URL
  const fileUrl = `/${config.uploadPath}/${fileName}`.replace(/\\/g, '/')
  
  return {
    fileName,
    originalName: file.name,
    filePath,
    fileUrl,
    fileSize: file.size,
    mimeType: file.type,
    uploadedAt: new Date()
  }
}

// Validate file against configuration
function validateFile(file: File, config: FileUploadConfig): void {
  if (!file) {
    throw new Error('No file provided')
  }
  
  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = config.maxSize / (1024 * 1024)
    throw new Error(`File size exceeds maximum allowed size of ${maxSizeMB}MB`)
  }
  
  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    throw new Error(`File type "${file.type}" is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`)
  }
  
  // Check for dangerous file extensions
  const fileName = file.name.toLowerCase()
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar', 
    '.vbs', '.js', '.php', '.asp', '.aspx', '.jsp', '.sh'
  ]
  
  if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
    throw new Error('File type not allowed for security reasons')
  }
  
  // Check for null bytes in filename
  if (file.name.includes('\0')) {
    throw new Error('Invalid filename')
  }
  
  // Check filename length
  if (file.name.length > 255) {
    throw new Error('Filename too long')
  }
}

// Generate secure filename
function generateSecureFileName(
  file: File,
  config: FileUploadConfig,
  userId?: string
): string {
  const extension = path.extname(file.name)
  const baseName = path.basename(file.name, extension)
  
  if (config.generateUniqueName) {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now()
    const randomString = crypto.randomBytes(8).toString('hex')
    const userPrefix = userId ? `${userId}-` : ''
    
    return `${userPrefix}${timestamp}-${randomString}${extension}`
  }
  
  if (config.preserveOriginalName) {
    // Sanitize original filename but preserve it
    const sanitizedBaseName = sanitizeFileName(baseName)
    return `${sanitizedBaseName}${extension}`
  }
  
  // Default: sanitized filename with timestamp
  const sanitizedBaseName = sanitizeFileName(baseName)
  const timestamp = Date.now()
  return `${timestamp}-${sanitizedBaseName}${extension}`
}

// File type detection using magic numbers
export function detectFileType(buffer: Buffer): string | null {
  // Check magic numbers for common file types
  const magicNumbers: { [key: string]: number[] } = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
    'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
  }
  
  for (const [mimeType, signature] of Object.entries(magicNumbers)) {
    if (signature.every((byte, index) => buffer[index] === byte)) {
      return mimeType
    }
  }
  
  return null
}

// Validate file content matches declared type
export function validateFileContent(file: File, buffer: Buffer): boolean {
  const detectedType = detectFileType(buffer)
  
  if (!detectedType) {
    // If we can't detect the type, allow text files and some others
    const allowedUndetectable = ['text/plain', 'application/json']
    return allowedUndetectable.includes(file.type)
  }
  
  return detectedType === file.type
}

// Clean up old files (for maintenance)
export async function cleanupOldFiles(
  uploadPath: string,
  maxAgeMs: number = 30 * 24 * 60 * 60 * 1000 // 30 days
): Promise<void> {
  const fs = require('fs').promises
  const uploadDir = path.join(process.cwd(), uploadPath)
  
  try {
    const files = await fs.readdir(uploadDir)
    const now = Date.now()
    
    for (const file of files) {
      const filePath = path.join(uploadDir, file)
      const stats = await fs.stat(filePath)
      
      if (now - stats.mtime.getTime() > maxAgeMs) {
        await fs.unlink(filePath)
        console.log(`Cleaned up old file: ${file}`)
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error)
  }
}

// Virus scanning placeholder (integrate with actual antivirus service)
export async function scanFileForViruses(filePath: string): Promise<boolean> {
  // This is a placeholder for virus scanning
  // In production, integrate with services like:
  // - ClamAV
  // - VirusTotal API
  // - AWS GuardDuty
  // - Azure Defender
  
  console.log(`Virus scan placeholder for: ${filePath}`)
  return true // Assume clean for now
}

// File metadata extraction
export function extractFileMetadata(file: File): Record<string, any> {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    lastModifiedDate: new Date(file.lastModified),
  }
}
