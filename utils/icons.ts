// Fallback icons to prevent TypeScript errors when lucide-react is not available
import { type ComponentType, type SVGProps } from 'react';

// Create a simple fallback icon component
export const createFallbackIcon = (name: string): ComponentType<SVGProps<SVGSVGElement>> => {
  return function FallbackIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  };
};

// Export fallback icons
export const CreditCard = createFallbackIcon('CreditCard');
export const Search = createFallbackIcon('Search');
export const Filter = createFallbackIcon('Filter');
export const TrendingUp = createFallbackIcon('TrendingUp');
export const TrendingDown = createFallbackIcon('TrendingDown');
export const DollarSign = createFallbackIcon('DollarSign');
export const Repeat = createFallbackIcon('Repeat');
export const RefreshCw = createFallbackIcon('RefreshCw');
export const Download = createFallbackIcon('Download');
export const Eye = createFallbackIcon('Eye');
export const Calendar = createFallbackIcon('Calendar');
