
import { z } from 'zod';

// Common validation patterns
const phoneRegex = /^(\+254|0)[17]\d{8}$/;
// Enhanced password regex with better security requirements
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Registration/Signup Schema with enhanced password validation
export const registrationSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
  
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
  
  email: z.string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters'),
  
  phone: z.string()
    .regex(phoneRegex, 'Please enter a valid Kenyan phone number (e.g., +254712345678 or 0712345678)'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)'),
  
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  
  userType: z.enum(['talent', 'organizer'], {
    required_error: 'Please select whether you are a talent or organizer'
  }),
  
  referralCode: z.string().optional(),
  
  terms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login Schema
export const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  
  password: z.string()
    .min(1, 'Password is required'),
  
  rememberMe: z.boolean().optional()
});

// Package Creation Schema
export const packageSchema = z.object({
  title: z.string()
    .min(5, 'Package title must be at least 5 characters')
    .max(100, 'Package title must be less than 100 characters'),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  
  category: z.string()
    .min(1, 'Please select a category'),
  
  price: z.number()
    .min(100, 'Minimum price is KES 100')
    .max(1000000, 'Maximum price is KES 1,000,000'),
  
  duration: z.number()
    .min(1, 'Duration must be at least 1 hour')
    .max(24, 'Duration cannot exceed 24 hours'),
  
  location: z.string()
    .min(3, 'Location must be at least 3 characters')
    .max(100, 'Location must be less than 100 characters'),
  
  requirements: z.string()
    .max(500, 'Requirements must be less than 500 characters')
    .optional(),
  
  tags: z.array(z.string())
    .min(1, 'Please add at least one tag')
    .max(10, 'Maximum 10 tags allowed'),
  
  isActive: z.boolean().default(true)
});

// KYC Upload Schema (simplified for file uploads)
export const kycSchema = z.object({
  documentType: z.enum(['national_id', 'business_registration'], {
    required_error: 'Please select a document type'
  })
});

// Profile Update Schema
export const profileUpdateSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  
  phone: z.string()
    .regex(phoneRegex, 'Please enter a valid Kenyan phone number'),
  
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  
  location: z.string()
    .min(3, 'Location must be at least 3 characters')
    .max(100, 'Location must be less than 100 characters')
    .optional(),
  
  website: z.string()
    .url('Please enter a valid website URL')
    .optional()
    .or(z.literal('')),
  
  socialMedia: z.object({
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    linkedin: z.string().optional()
  }).optional(),
  
  skills: z.array(z.string())
    .max(20, 'Maximum 20 skills allowed')
    .optional(),
  
  experience: z.string()
    .max(1000, 'Experience must be less than 1000 characters')
    .optional(),
  
  hourlyRate: z.number()
    .min(50, 'Minimum hourly rate is KES 50')
    .max(50000, 'Maximum hourly rate is KES 50,000')
    .optional()
});

// Event Creation Schema
export const eventSchema = z.object({
  title: z.string()
    .min(5, 'Event title must be at least 5 characters')
    .max(100, 'Event title must be less than 100 characters'),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  
  category: z.string()
    .min(1, 'Please select a category'),
  
  startDate: z.date({
    required_error: 'Start date is required'
  }).refine((date) => date > new Date(), {
    message: 'Start date must be in the future'
  }),
  
  endDate: z.date({
    required_error: 'End date is required'
  }),
  
  location: z.string()
    .min(5, 'Location must be at least 5 characters')
    .max(200, 'Location must be less than 200 characters'),
  
  budget: z.number()
    .min(1000, 'Minimum budget is KES 1,000')
    .max(10000000, 'Maximum budget is KES 10,000,000'),
  
  expectedAttendees: z.number()
    .min(1, 'Expected attendees must be at least 1')
    .max(100000, 'Maximum expected attendees is 100,000'),
  
  requirements: z.string()
    .max(1000, 'Requirements must be less than 1000 characters')
    .optional(),
  
  isPublic: z.boolean().default(true),
  
  tags: z.array(z.string())
    .min(1, 'Please add at least one tag')
    .max(15, 'Maximum 15 tags allowed')
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Booking Schema
export const bookingSchema = z.object({
  packageId: z.string()
    .min(1, 'Package selection is required'),
  
  eventDate: z.date({
    required_error: 'Event date is required'
  }).refine((date) => date > new Date(), {
    message: 'Event date must be in the future'
  }),
  
  startTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)'),
  
  duration: z.number()
    .min(1, 'Duration must be at least 1 hour')
    .max(24, 'Duration cannot exceed 24 hours'),
  
  location: z.string()
    .min(5, 'Location must be at least 5 characters')
    .max(200, 'Location must be less than 200 characters'),
  
  specialRequests: z.string()
    .max(500, 'Special requests must be less than 500 characters')
    .optional(),
  
  contactPhone: z.string()
    .regex(phoneRegex, 'Please enter a valid Kenyan phone number'),
  
  emergencyContact: z.object({
    name: z.string()
      .min(2, 'Emergency contact name must be at least 2 characters')
      .max(50, 'Emergency contact name must be less than 50 characters'),
    phone: z.string()
      .regex(phoneRegex, 'Please enter a valid phone number for emergency contact')
  }),
  
  agreedToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the booking terms and conditions'
  })
});

// Review Schema
export const reviewSchema = z.object({
  rating: z.number()
    .min(1, 'Please provide a rating')
    .max(5, 'Rating cannot exceed 5 stars'),
  
  comment: z.string()
    .min(10, 'Review comment must be at least 10 characters')
    .max(500, 'Review comment must be less than 500 characters'),
  
  wouldRecommend: z.boolean(),
  
  categories: z.object({
    professionalism: z.number().min(1).max(5),
    communication: z.number().min(1).max(5),
    quality: z.number().min(1).max(5),
    punctuality: z.number().min(1).max(5)
  })
});

// Settings Schema
export const settingsSchema = z.object({
  notifications: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(true),
    push: z.boolean().default(true),
    marketing: z.boolean().default(false)
  }),
  
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'contacts_only']).default('public'),
    showEmail: z.boolean().default(false),
    showPhone: z.boolean().default(false),
    allowMessages: z.boolean().default(true)
  }),
  
  preferences: z.object({
    language: z.enum(['en', 'sw']).default('en'),
    currency: z.enum(['KES', 'USD']).default('KES'),
    timezone: z.string().default('Africa/Nairobi')
  })
});

// Organizer Profile Update Schema
export const organizerProfileUpdateSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  
  companyName: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters')
    .optional(),
  
  bio: z.string()
    .max(1000, 'Bio must be less than 1000 characters')
    .optional(),
  
  website: z.string()
    .url('Please enter a valid website URL')
    .optional()
    .or(z.literal('')),
  
  phoneNumber: z.string()
    .regex(phoneRegex, 'Please enter a valid Kenyan phone number')
    .optional(),
  
  location: z.string()
    .min(3, 'Location must be at least 3 characters')
    .max(100, 'Location must be less than 100 characters')
    .optional(),
  
  eventTypes: z.array(z.string())
    .max(10, 'Maximum 10 event types allowed')
    .optional()
});

// Export types
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type PackageFormData = z.infer<typeof packageSchema>;
export type KYCFormData = z.infer<typeof kycSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type OrganizerProfileUpdateFormData = z.infer<typeof organizerProfileUpdateSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
