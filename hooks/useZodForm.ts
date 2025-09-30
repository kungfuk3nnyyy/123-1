
import { useForm, UseFormProps, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';

export function useZodForm<T extends FieldValues>(
  schema: ZodSchema<T>,
  options?: Omit<UseFormProps<T>, 'resolver'>
) {
  return useForm<T>({
    resolver: zodResolver(schema),
    mode: 'onBlur', // Changed to onBlur for better UX - validates when user leaves field
    ...options,
  });
}
