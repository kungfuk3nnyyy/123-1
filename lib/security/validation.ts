
import { z } from 'zod'

// Common validation schemas
export const commonSchemas = {
  // String validations
  safeString: z.string().min(1).max(1000).trim(),
  shortString: z.string().min(1).max(255).trim(),
  longString: z.string().min(1).max(5000).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  url: z.string().url().max(2000),
  
  // Numeric validations
  positiveNumber: z.number().positive(),
  nonNegativeNumber: z.number().min(0),
  currency: z.number().positive().max(1000000),
  
  // ID validations
  uuid: z.string().uuid(),
  mongoId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  
  // Date validations
  futureDate: z.string().datetime().refine((date) => new Date(date) > new Date(), {
    message: "Date must be in the future"
  }),
  pastDate: z.string().datetime().refine((date) => new Date(date) < new Date(), {
    message: "Date must be in the past"
  }),
  
  // File validations
  fileSize: z.number().max(50 * 1024 * 1024), // 50MB max
  fileName: z.string().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/),
  
  // Array validations
  stringArray: z.array(z.string().trim()).max(50),
  skillsArray: z.array(z.string().min(1).max(50)).max(20),
}

// User input schemas
export const userInputSchemas = {
  profile: z.object({
    name: commonSchemas.shortString,
    bio: commonSchemas.longString.optional(),
    location: commonSchemas.shortString.optional(),
    website: commonSchemas.url.optional(),
    skills: commonSchemas.skillsArray.optional(),
    hourlyRate: commonSchemas.currency.optional(),
  }),
  
  booking: z.object({
    talentId: commonSchemas.uuid,
    packageTitle: commonSchemas.shortString.optional(),
    eventDate: commonSchemas.futureDate,
    duration: z.string().regex(/^\d+\s+(hours?|days?)$/),
    venue: commonSchemas.shortString,
    message: commonSchemas.longString.optional(),
    budget: commonSchemas.currency,
  }),
  
  message: z.object({
    content: commonSchemas.longString,
    recipientId: commonSchemas.uuid,
    bookingId: commonSchemas.uuid.optional(),
  }),
  
  review: z.object({
    rating: z.number().int().min(1).max(5),
    comment: commonSchemas.longString.optional(),
    bookingId: commonSchemas.uuid,
  }),
  
  availability: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    isAvailable: z.boolean(),
    notes: commonSchemas.shortString.optional(),
  }),
  
  package: z.object({
    title: commonSchemas.shortString,
    description: commonSchemas.longString,
    price: commonSchemas.currency,
    duration: z.string().regex(/^\d+\s+(hours?|days?)$/),
    category: commonSchemas.shortString,
    features: commonSchemas.stringArray.optional(),
  }),
}

// File upload schemas
export const fileUploadSchemas = {
  image: z.object({
    file: z.any(),
    maxSize: z.number().default(5 * 1024 * 1024), // 5MB
    allowedTypes: z.array(z.string()).default([
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ]),
  }),
  
  document: z.object({
    file: z.any(),
    maxSize: z.number().default(10 * 1024 * 1024), // 10MB
    allowedTypes: z.array(z.string()).default([
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]),
  }),
  
  media: z.object({
    file: z.any(),
    maxSize: z.number().default(50 * 1024 * 1024), // 50MB
    allowedTypes: z.array(z.string()).default([
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
      'application/pdf', 'text/plain'
    ]),
  }),
}

// Query parameter schemas
export const querySchemas = {
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  }),
  
  search: z.object({
    q: commonSchemas.shortString.optional(),
    category: commonSchemas.shortString.optional(),
    location: commonSchemas.shortString.optional(),
    minPrice: z.string().regex(/^\d+(\.\d{2})?$/).transform(Number).optional(),
    maxPrice: z.string().regex(/^\d+(\.\d{2})?$/).transform(Number).optional(),
  }),
  
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
}

// Validation helper functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }
    throw error
  }
}

export function validateFileUpload(file: File, config: { maxSize: number; allowedTypes: string[] }) {
  if (!file) {
    throw new Error('No file provided')
  }
  
  if (file.size > config.maxSize) {
    throw new Error(`File size too large. Maximum size is ${config.maxSize / (1024 * 1024)}MB`)
  }
  
  if (!config.allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${config.allowedTypes.join(', ')}`)
  }
  
  // Additional security checks
  const fileName = file.name.toLowerCase()
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar', '.vbs', '.js', '.php']
  
  if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
    throw new Error('File type not allowed for security reasons')
  }
  
  return true
}

// Sanitize file names
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255)
}
