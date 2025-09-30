
import { writeFile, mkdir, access, unlink } from 'fs/promises'
import path from 'path'
import { NextRequest } from 'next/server'

export interface UploadConfig {
  maxFileSize: number // in bytes
  allowedMimeTypes: string[]
  uploadDir: string
}

export interface UploadedFile {
  fileName: string
  filePath: string
  fileUrl: string
  fileSize: number
  mimeType: string
}

export const KYC_UPLOAD_CONFIG: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ],
  uploadDir: path.join(process.cwd(), 'uploads', 'kyc')
}

export class FileUploadError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'FileUploadError'
  }
}

export async function validateFile(file: File, config: UploadConfig): Promise<void> {
  // Check file size
  if (file.size > config.maxFileSize) {
    throw new FileUploadError(
      `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(config.maxFileSize / 1024 / 1024).toFixed(2)}MB`,
      'FILE_TOO_LARGE'
    )
  }

  // Check MIME type
  if (!config.allowedMimeTypes.includes(file.type)) {
    throw new FileUploadError(
      `File type ${file.type} is not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`,
      'INVALID_FILE_TYPE'
    )
  }

  // Check if file has content
  if (file.size === 0) {
    throw new FileUploadError('File is empty', 'EMPTY_FILE')
  }

  // Enhanced security validations
  await validateFileExtension(file)
  await validateFileMagicNumbers(file)
  await validateFileName(file.name)
}

/**
 * Validate file extension matches MIME type
 */
export async function validateFileExtension(file: File): Promise<void> {
  const allowedExtensions: { [key: string]: string[] } = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/pdf': ['.pdf']
  }

  const expectedExtensions = allowedExtensions[file.type]
  if (expectedExtensions) {
    const fileExtension = path.extname(file.name).toLowerCase()
    if (!expectedExtensions.includes(fileExtension)) {
      throw new FileUploadError(
        `File extension ${fileExtension} does not match MIME type ${file.type}`,
        'EXTENSION_MISMATCH'
      )
    }
  }
}

/**
 * Validate file magic numbers (file signatures)
 */
export async function validateFileMagicNumbers(file: File): Promise<void> {
  const magicNumbers: { [key: string]: number[] } = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'application/pdf': [0x25, 0x50, 0x44, 0x46]
  }

  const expectedMagic = magicNumbers[file.type]
  if (expectedMagic) {
    const buffer = await file.slice(0, expectedMagic.length).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    for (let i = 0; i < expectedMagic.length; i++) {
      if (bytes[i] !== expectedMagic[i]) {
        throw new FileUploadError(
          `File content does not match declared MIME type ${file.type}`,
          'INVALID_FILE_SIGNATURE'
        )
      }
    }
  }
}

/**
 * Validate and sanitize file name
 */
export async function validateFileName(fileName: string): Promise<void> {
  // Check for dangerous file extensions
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.php', '.asp', '.aspx', '.jsp', '.sh', '.py', '.rb', '.pl'
  ]

  const fileExtension = path.extname(fileName).toLowerCase()
  if (dangerousExtensions.includes(fileExtension)) {
    throw new FileUploadError(
      `File extension ${fileExtension} is not allowed for security reasons`,
      'DANGEROUS_FILE_TYPE'
    )
  }

  // Check for suspicious file name patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /[<>:"|?*]/,  // Invalid characters
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,  // Windows reserved names
    /^\./,  // Hidden files
    /\s+$/,  // Trailing whitespace
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fileName)) {
      throw new FileUploadError(
        'File name contains invalid or suspicious characters',
        'INVALID_FILE_NAME'
      )
    }
  }

  // Check file name length
  if (fileName.length > 255) {
    throw new FileUploadError(
      'File name is too long (maximum 255 characters)',
      'FILE_NAME_TOO_LONG'
    )
  }
}

export async function ensureUploadDirectory(uploadDir: string): Promise<void> {
  try {
    await access(uploadDir)
  } catch {
    // Directory doesn't exist, create it
    await mkdir(uploadDir, { recursive: true })
  }
}

export async function generateUniqueFileName(
  originalName: string,
  prefix: string = '',
  suffix: string = ''
): Promise<string> {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = path.extname(originalName)
  const baseName = path.basename(originalName, extension)
  
  // Sanitize filename
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_')
  
  return `${prefix}${sanitizedBaseName}_${timestamp}_${random}${suffix}${extension}`
}

export async function saveUploadedFile(
  file: File,
  config: UploadConfig,
  fileNamePrefix: string = ''
): Promise<UploadedFile> {
  // Validate file
  await validateFile(file, config)
  
  // Ensure upload directory exists
  await ensureUploadDirectory(config.uploadDir)
  
  // Generate unique filename
  const fileName = await generateUniqueFileName(file.name, fileNamePrefix)
  const filePath = path.join(config.uploadDir, fileName)
  const fileUrl = `/uploads/kyc/${fileName}`
  
  // Convert file to buffer and save
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  try {
    await writeFile(filePath, buffer)
  } catch (error) {
    throw new FileUploadError(
      `Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SAVE_FAILED'
    )
  }
  
  return {
    fileName,
    filePath,
    fileUrl,
    fileSize: file.size,
    mimeType: file.type
  }
}

export async function deleteUploadedFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath)
  } catch (error) {
    console.error('Failed to delete file:', filePath, error)
    // Don't throw error for file deletion failures
  }
}

export async function extractFilesFromFormData(
  formData: FormData,
  expectedFiles: { key: string; required: boolean }[]
): Promise<{ [key: string]: File | null }> {
  const files: { [key: string]: File | null } = {}
  
  for (const { key, required } of expectedFiles) {
    const file = formData.get(key) as File | null
    
    if (required && (!file || file.size === 0)) {
      throw new FileUploadError(`Required file '${key}' is missing`, 'MISSING_REQUIRED_FILE')
    }
    
    files[key] = file && file.size > 0 ? file : null
  }
  
  return files
}

// Helper function to get file extension from MIME type
export function getFileExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'application/pdf': '.pdf'
  }
  
  return mimeToExt[mimeType] || '.bin'
}

// Helper function to check if file is an image
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
