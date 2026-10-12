import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground ring-transparent",
        secondary:
          "border-transparent bg-muted text-muted-foreground ring-foreground/10",
        outline: "bg-background text-foreground ring-foreground/15",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-700 ring-emerald-600/30 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-500/15 text-amber-700 ring-amber-600/30 dark:text-amber-400",
        destructive:
          "border-transparent bg-destructive/15 text-destructive ring-destructive/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
