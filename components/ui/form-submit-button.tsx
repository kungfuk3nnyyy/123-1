
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormSubmitButtonProps {
  isSubmitting?: boolean;
  isValid?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  allowInvalidSubmit?: boolean; // New prop to allow submission even when form is invalid
}

export function FormSubmitButton({
  isSubmitting = false,
  isValid = true,
  children,
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
  allowInvalidSubmit = false,
  ...props
}: FormSubmitButtonProps) {
  // Only disable for explicit disabled prop or when submitting
  // If allowInvalidSubmit is true, don't disable based on form validity
  const isDisabled = isSubmitting || disabled || (!allowInvalidSubmit && !isValid);

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={isDisabled}
      className={cn(
        'relative transition-all duration-200',
        isSubmitting && 'cursor-not-allowed',
        !isValid && !allowInvalidSubmit && 'opacity-60 cursor-not-allowed',
        !isValid && allowInvalidSubmit && 'hover:opacity-90',
        className
      )}
      {...props}
    >
      {isSubmitting && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {children}
    </Button>
  );
}
