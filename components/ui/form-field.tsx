
import React, { isValidElement, cloneElement, ReactNode, ReactElement } from 'react';
import { FieldError, FieldValues } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface FormFieldProps<TFieldValues extends FieldValues = FieldValues> {
  label?: string;
  error?: FieldError;
  children: ReactNode;
  required?: boolean;
  className?: string;
  description?: string;
  name?: string;
  value?: TFieldValues[keyof TFieldValues];
  onChange?: (value: TFieldValues[keyof TFieldValues]) => void;
  onBlur?: () => void;
}

export function FormField<TFieldValues extends FieldValues = FieldValues>({
  label,
  error,
  children,
  required = false,
  className,
  description,
  name,
  value,
  onChange,
  onBlur,
  ...props
}: FormFieldProps<TFieldValues>) {
  const hasError = !!error;
  const childrenArray = React.Children.toArray(children);
  const firstChild = childrenArray[0] as ReactElement;
  
  if (!firstChild) {
    console.warn('FormField requires at least one child element');
    return null;
  }
  
  const childProps = firstChild?.props || {};
  const childClassName = childProps?.className || '';
  const hasValue = value !== undefined && value !== '' && value !== null;
  const isValid = !hasError && hasValue;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {isValidElement(firstChild) ? (
          cloneElement(firstChild, {
            ...childProps,
            className: cn(
              childClassName,
              hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              isValid && 'border-green-500 focus:border-green-500 focus:ring-green-500',
              className
            ),
            'aria-invalid': hasError ? 'true' : 'false',
            name,
            value: value !== undefined ? value : childProps.value,
            onChange: onChange || childProps.onChange,
            onBlur: onBlur || childProps.onBlur,
            ...props
          } as any)
        ) : (
          <div className="text-red-500 text-sm">
            Form field requires a single valid React element as a child
          </div>
        )}
        
        {/* Render any additional children as-is */}
        {childrenArray.length > 1 && childrenArray.slice(1)}
        
        {/* Success indicator */}
        {isValid && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
        
        {/* Error indicator */}
        {hasError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}
      </div>
      
      {description && !hasError && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      {hasError && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error.message}
        </p>
      )}
    </div>
  );
}
