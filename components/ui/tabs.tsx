"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Glass pill bar — frosted, hairline outer border, inner highlight.
      "inline-flex h-12 items-center justify-start gap-1 overflow-x-auto rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] p-1.5 text-[color:var(--color-muted-foreground)] shadow-[inset_0_1px_0_var(--glass-highlight),0_0_0_1px_var(--glass-edge)] backdrop-blur-xl",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-[color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] disabled:pointer-events-none disabled:opacity-50",
      // Active state: tinted by extracted palette + soft glow.
      "data-[state=active]:bg-[color-mix(in_oklab,var(--palette-primary,var(--color-primary))_22%,transparent)] data-[state=active]:text-[color:var(--color-foreground)] data-[state=active]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--palette-primary,var(--color-primary))_40%,transparent),0_4px_12px_-6px_color-mix(in_oklab,var(--palette-primary,var(--color-primary))_60%,transparent)]",
      "hover:text-[color:var(--color-foreground)]",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
