import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Family buttons are Archivo 700 with a centred label, radius 11-16, and a
  // 44px minimum so every tap target clears the floor the handoff sets.
  "group/button inline-flex shrink-0 items-center justify-center rounded-cb-button border border-transparent bg-clip-padding font-cb-sans text-cb-body font-bold whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary: accent fill, ink label, pressed step on hover.
        default: "bg-cb-or text-cb-on-or hover:bg-cb-or-pressed",
        // Ghost/tertiary: 1px line, second-tier label, accent on hover.
        outline:
          "border-cb-line bg-transparent text-cb-second hover:border-cb-or hover:text-cb-or",
        // Secondary: raised fill.
        secondary:
          "bg-cb-raised text-cb-text hover:bg-cb-raised-hover",
        ghost:
          "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // 44 is the family's tap-target floor; 48 for phone rows and 52-56 for
        // an action bar, which `block` pairs with for a full-width action.
        default: "h-11 gap-1.5 px-4",
        xs: "h-8 gap-1 rounded-cb-chip px-2.5 text-cb-foot",
        sm: "h-11 gap-1 px-3.5 text-cb-foot",
        lg: "h-13 gap-1.5 rounded-cb-card px-5 text-cb-card",
        block: "h-14 w-full gap-2 rounded-cb-card px-5 text-cb-card",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
