
'use client'

import React, { useMemo } from 'react'
import { sanitizeTextInput, encodeHTML } from '@/lib/security/clientSanitization'

interface SecureContentProps {
  content: string
  allowBasicFormatting?: boolean
  maxLength?: number
  className?: string
  as?: keyof JSX.IntrinsicElements
}

// Component for safely displaying user-generated content
export function SecureContent({ 
  content, 
  allowBasicFormatting = false, 
  maxLength = 1000,
  className = '',
  as: Component = 'div'
}: SecureContentProps) {
  const sanitizedContent = useMemo(() => {
    if (!content || typeof content !== 'string') {
      return ''
    }
    
    let sanitized = sanitizeTextInput(content)
    
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength) + '...'
    }
    
    if (allowBasicFormatting) {
      // Allow basic formatting like line breaks
      sanitized = sanitized.replace(/\n/g, '<br />')
    }
    
    return sanitized
  }, [content, allowBasicFormatting, maxLength])
  
  if (allowBasicFormatting) {
    return (
      <Component 
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    )
  }
  
  return (
    <Component className={className}>
      {sanitizedContent}
    </Component>
  )
}

interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSecureChange?: (sanitizedValue: string) => void
  maxLength?: number
  allowedChars?: RegExp
}

// Secure input component that sanitizes input in real-time
export function SecureInput({ 
  onSecureChange, 
  onChange,
  maxLength = 255,
  allowedChars,
  ...props 
}: SecureInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Apply character restrictions
    if (allowedChars) {
      value = value.replace(allowedChars, '')
    }
    
    // Apply length limit
    if (maxLength && value.length > maxLength) {
      value = value.substring(0, maxLength)
    }
    
    // Sanitize the value
    const sanitizedValue = sanitizeTextInput(value)
    
    // Update the input value
    e.target.value = sanitizedValue
    
    // Call the secure change handler
    if (onSecureChange) {
      onSecureChange(sanitizedValue)
    }
    
    // Call the original onChange if provided
    if (onChange) {
      onChange(e)
    }
  }
  
  return (
    <input
      {...props}
      onChange={handleChange}
      maxLength={maxLength}
    />
  )
}

interface SecureTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSecureChange?: (sanitizedValue: string) => void
  maxLength?: number
  allowedChars?: RegExp
}

// Secure textarea component
export function SecureTextarea({ 
  onSecureChange, 
  onChange,
  maxLength = 5000,
  allowedChars,
  ...props 
}: SecureTextareaProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value
    
    // Apply character restrictions
    if (allowedChars) {
      value = value.replace(allowedChars, '')
    }
    
    // Apply length limit
    if (maxLength && value.length > maxLength) {
      value = value.substring(0, maxLength)
    }
    
    // Sanitize the value
    const sanitizedValue = sanitizeTextInput(value)
    
    // Update the textarea value
    e.target.value = sanitizedValue
    
    // Call the secure change handler
    if (onSecureChange) {
      onSecureChange(sanitizedValue)
    }
    
    // Call the original onChange if provided
    if (onChange) {
      onChange(e)
    }
  }
  
  return (
    <textarea
      {...props}
      onChange={handleChange}
      maxLength={maxLength}
    />
  )
}

interface SecureFileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onSecureFileSelect?: (files: FileList | null, validationErrors: string[]) => void
  maxSize?: number
  allowedTypes?: string[]
  maxFiles?: number
}

// Secure file input component with built-in validation
export function SecureFileInput({
  onSecureFileSelect,
  onChange,
  maxSize = 5 * 1024 * 1024, // 5MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxFiles = 1,
  ...props
}: SecureFileInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    const errors: string[] = []
    
    if (files) {
      // Check file count
      if (files.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} file(s) allowed`)
      }
      
      // Validate each file
      Array.from(files).forEach((file, index) => {
        // Check file size
        if (file.size > maxSize) {
          const maxSizeMB = Math.round(maxSize / (1024 * 1024))
          errors.push(`File ${index + 1}: Size exceeds ${maxSizeMB}MB limit`)
        }
        
        // Check file type
        if (!allowedTypes.includes(file.type)) {
          errors.push(`File ${index + 1}: Type "${file.type}" not allowed`)
        }
        
        // Check for dangerous extensions
        const fileName = file.name.toLowerCase()
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar', '.vbs', '.js', '.php']
        
        if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
          errors.push(`File ${index + 1}: File type not allowed for security reasons`)
        }
        
        // Check filename length
        if (file.name.length > 255) {
          errors.push(`File ${index + 1}: Filename too long`)
        }
      })
    }
    
    // Call the secure file select handler
    if (onSecureFileSelect) {
      onSecureFileSelect(files, errors)
    }
    
    // Call the original onChange if provided
    if (onChange) {
      onChange(e)
    }
  }
  
  return (
    <input
      {...props}
      type="file"
      onChange={handleChange}
      accept={allowedTypes.join(',')}
    />
  )
}

// Hook for secure form handling
export function useSecureForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Record<keyof T, Array<(value: any) => string | null>>
) {
  const [values, setValues] = React.useState<T>(initialValues)
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const setValue = (field: keyof T, value: any) => {
    const sanitizedValue = typeof value === 'string' ? sanitizeTextInput(value) : value
    setValues(prev => ({ ...prev, [field]: sanitizedValue }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }
  
  const validate = (): boolean => {
    if (!validationRules) return true
    
    const newErrors: Partial<Record<keyof T, string>> = {}
    
    for (const [field, rules] of Object.entries(validationRules)) {
      const value = values[field as keyof T]
      
      for (const rule of rules) {
        const error = rule(value)
        if (error) {
          newErrors[field as keyof T] = error
          break
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (
    onSubmit: (values: T) => Promise<void> | void,
    e?: React.FormEvent
  ) => {
    if (e) {
      e.preventDefault()
    }
    
    if (!validate()) {
      return
    }
    
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return {
    values,
    errors,
    isSubmitting,
    setValue,
    validate,
    handleSubmit,
    reset: () => {
      setValues(initialValues)
      setErrors({})
      setIsSubmitting(false)
    }
  }
}
