
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-calm-soft-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-calm-dark-grey text-white hover:bg-calm-dark-grey-dark shadow-md hover:shadow-lg",
        primary: "bg-calm-dark-grey text-white hover:bg-calm-dark-grey-dark shadow-md hover:shadow-xl transform hover:scale-105",
        secondary: "bg-calm-soft-blue text-white hover:bg-calm-soft-blue-dark shadow-md hover:shadow-lg",
        accent: "bg-calm-cool-beige text-calm-dark-grey hover:bg-calm-cool-beige-dark shadow-md hover:shadow-lg",
        success: "bg-calm-success text-white hover:bg-calm-success-dark shadow-md hover:shadow-lg",
        warning: "bg-calm-warning text-white hover:bg-calm-warning-dark shadow-md hover:shadow-lg",
        destructive: "bg-calm-danger text-white hover:bg-calm-danger-dark shadow-md hover:shadow-lg",
        outline: "border-2 border-calm-soft-blue text-calm-soft-blue bg-transparent hover:bg-calm-soft-blue hover:text-white shadow-sm hover:shadow-md",
        ghost: "text-calm-dark-grey hover:bg-calm-light-grey-light hover:text-calm-dark-grey-dark",
        link: "text-calm-soft-blue underline-offset-4 hover:underline hover:text-calm-soft-blue-dark",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 py-3 text-base font-bold",
        xl: "h-14 rounded-lg px-10 py-4 text-lg font-bold",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
