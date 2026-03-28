/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-ds-md ds-body-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-interactive focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:     "bg-ds-interactive text-ds-text-inverse hover:bg-ds-interactive-hover",
        destructive: "bg-ds-feedback-error text-ds-text-inverse hover:bg-ds-feedback-error/90",
        outline:     "border border-ds-border bg-ds-bg-primary text-ds-text-primary hover:bg-ds-bg-secondary",
        secondary:   "bg-ds-bg-secondary text-ds-text-secondary hover:bg-ds-bg-tertiary",
        ghost:       "text-ds-text-primary hover:bg-ds-bg-secondary",
        link:        "text-ds-interactive underline-offset-4 hover:underline",
      },
      size: {
        default: "h-ds-10 px-ds-4 py-ds-2",
        sm:      "h-ds-8 rounded-ds-md px-ds-3",
        lg:      "h-ds-10 rounded-ds-md px-ds-8",
        icon:    "h-ds-10 w-ds-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
