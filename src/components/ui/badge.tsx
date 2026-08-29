import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Family chip: JetBrains Mono 10-11, radius 8-9, raised fill, 5-7 x 8-11
  // padding. Not a pill and not a sans label — meta reads as mono across the
  // family, and only *labels* are uppercased, never values like "30 min".
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[9px] border border-transparent px-2.5 py-1 font-cb-mono text-[11px] font-medium whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        // The truth chip: accent tint, accent label. Reserved for facts the app
        // vouches for, the way the family reserves it for pantry and season.
        default: "bg-cb-or-tint text-cb-or",
        secondary: "bg-cb-raised text-cb-second",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20",
        outline: "border-cb-line text-cb-muted",
        ghost:
          "text-muted-foreground",
        success: "bg-success/12 text-success border-success/25",
        warning: "bg-warning/12 text-warning border-warning/25",
        danger: "bg-danger/12 text-danger border-danger/25",
        info: "bg-info/12 text-info border-info/25",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
