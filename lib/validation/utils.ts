
import { FieldError, FieldErrors } from 'react-hook-form';

// Helper function to get nested field errors
export function getFieldError(errors: FieldErrors, fieldPath: string): FieldError | undefined {
  const keys = fieldPath.split('.');
  let error: any = errors;
  
  for (const key of keys) {
    if (error && typeof error === 'object' && key in error) {
      error = error[key];
    } else {
      return undefined;
    }
  }
  
  return error as FieldError;
}

// Helper function to check if form has any errors
export function hasFormErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

// Helper function to get first error message
export function getFirstErrorMessage(errors: FieldErrors): string | undefined {
  const firstError = Object.values(errors)[0];
  if (firstError && typeof firstError === 'object' && 'message' in firstError) {
    return firstError.message as string;
  }
  return undefined;
}

// Helper function to format validation error messages
export function formatValidationErrors(errors: FieldErrors): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  function extractErrors(obj: any, prefix = '') {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const error = obj[key];
      
      if (error && typeof error === 'object') {
        if ('message' in error) {
          formattedErrors[fullKey] = error.message;
        } else {
          extractErrors(error, fullKey);
        }
      }
    });
  }
  
  extractErrors(errors);
  return formattedErrors;
}

// Common validation patterns
export const validationPatterns = {
  phone: /^(\+254|0)[17]\d{8}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  kenyanId: /^\d{7,8}$/,
  postalCode: /^\d{5}$/,
  time: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
};

// Helper function to validate file uploads
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    minWidth?: number;
    minHeight?: number;
  } = {}
): Promise<{ isValid: boolean; error?: string }> {
  return new Promise((resolve) => {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
      minWidth,
      minHeight
    } = options;

    // Check file size
    if (file.size > maxSize) {
      resolve({
        isValid: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
      });
      return;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      resolve({
        isValid: false,
        error: `File type must be one of: ${allowedTypes.join(', ')}`
      });
      return;
    }

    // Check image dimensions if specified
    if (minWidth || minHeight) {
      const img = new Image();
      img.onload = () => {
        if (minWidth && img.width < minWidth) {
          resolve({
            isValid: false,
            error: `Image width must be at least ${minWidth}px`
          });
          return;
        }
        if (minHeight && img.height < minHeight) {
          resolve({
            isValid: false,
            error: `Image height must be at least ${minHeight}px`
          });
          return;
        }
        resolve({ isValid: true });
      };
      img.onerror = () => {
        resolve({
          isValid: false,
          error: 'Invalid image file'
        });
      };
      img.src = URL.createObjectURL(file);
    } else {
      resolve({ isValid: true });
    }
  });
}

// Helper function to debounce validation
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
