/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-ds-full border px-ds-2 py-[2px] ds-badge transition-colors",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-ds-interactive text-ds-text-inverse",
        secondary:   "border-transparent bg-ds-bg-secondary text-ds-text-secondary",
        destructive: "border-transparent bg-ds-feedback-error text-ds-text-inverse",
        outline:     "border-ds-border text-ds-text-primary",
        success:     "border-transparent bg-ds-feedback-success-bg text-ds-feedback-success",
        warning:     "border-transparent bg-ds-feedback-warning-bg text-ds-feedback-warning",
        info:        "border-transparent bg-ds-feedback-info-bg text-ds-feedback-info",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
