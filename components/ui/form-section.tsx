
import React from 'react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
