import * as React from "react";
import { cn } from "@/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, onFocus, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-ds-10 w-full rounded-ds-md border border-ds-border bg-ds-bg-primary px-ds-3 py-ds-2 ds-body placeholder:text-ds-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-interactive focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:font-medium",
      className
    )}
    ref={ref}
    onFocus={(e) => {
      if (type === "number") e.target.select();
      onFocus?.(e);
    }}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
