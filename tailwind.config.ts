import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Improved Calm Professional Color Palette - WCAG Compliant
        calm: {
          // Main Content Background
          white: '#FFFFFF',
          'white-dark': '#F5F7F9',
          
          // Section Background
          'light-grey': '#E8ECEF',
          'light-grey-light': '#F2F4F6',
          'light-grey-dark': '#D1D7DD',
          
          // Header/Footer & Primary Interactive
          'soft-blue': '#7A95B3',
          'soft-blue-light': '#A3B8CC',
          'soft-blue-dark': '#5E7891',
          
          // Accent & Highlights
          'cool-beige': '#D4DCE5',
          'cool-beige-light': '#E8EDF3',
          'cool-beige-dark': '#B8C2D0',
          
          // Primary Text
          'dark-grey': '#4A5D6E',
          'dark-grey-light': '#6B7E90',
          'dark-grey-dark': '#2F3F4E',
          
          // Muted Semantic Colors
          success: '#6AA84F',
          'success-light': '#8BC473',
          'success-dark': '#4F7A3A',
          
          warning: '#E0A800',
          'warning-light': '#E8B833',
          'warning-dark': '#B58900',
          
          danger: '#C25E5E',
          'danger-light': '#D18181',
          'danger-dark': '#9A4747',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
