import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-full border border-[color:var(--glass-border-strong)] bg-[color:var(--glass-bg)] px-5 py-2 text-base text-[color:var(--color-foreground)] shadow-[inset_0_1px_0_var(--glass-highlight),0_0_0_1px_var(--glass-edge)] backdrop-blur-xl transition-[border-color,box-shadow,background-color] placeholder:text-[color:var(--color-muted-foreground)] focus-visible:border-[color:var(--palette-primary,var(--color-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--palette-primary,var(--color-primary))]/40 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
