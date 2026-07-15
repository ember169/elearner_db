import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-0.5 overflow-hidden rounded-full border border-transparent px-2 text-[11px] font-semibold whitespace-nowrap tracking-wide transition-all [&>svg]:pointer-events-none [&>svg]:size-2.5!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20",
        outline:
          "border-border text-muted-foreground",
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
