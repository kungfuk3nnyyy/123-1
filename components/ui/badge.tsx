
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-calm-soft-blue focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-calm-dark-grey text-white hover:bg-calm-dark-grey-dark",
        secondary: "border-transparent bg-calm-light-grey text-calm-dark-grey hover:bg-calm-light-grey-dark",
        destructive: "border-transparent bg-calm-danger text-white hover:bg-calm-danger-dark",
        outline: "text-calm-dark-grey border-calm-soft-blue hover:bg-calm-soft-blue hover:text-white",
        success: "border-transparent bg-calm-success text-white hover:bg-calm-success-dark",
        warning: "border-transparent bg-calm-warning text-white hover:bg-calm-warning-dark",
        info: "border-transparent bg-calm-soft-blue text-white hover:bg-calm-soft-blue-dark",
        accent: "border-transparent bg-calm-cool-beige text-calm-dark-grey hover:bg-calm-cool-beige-dark",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
