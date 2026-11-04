import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-white/85",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/85",
      outline: "border border-raised text-foreground hover:bg-secondary",
      secondary: "bg-secondary text-secondary-foreground hover:bg-raised",
      ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary",
      link: "text-foreground underline underline-offset-4 hover:text-muted-foreground",
    }

    const sizes = {
      default: "h-10 px-5",
      sm: "h-8 px-3.5 text-[13px]",
      lg: "h-12 px-7 text-base",
      icon: "h-10 w-10",
    }

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
