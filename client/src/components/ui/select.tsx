import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // Cyberpunk base styles
        "flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3",
        "text-sm font-rajdhani font-semibold tracking-wider whitespace-nowrap",
        "transition-all duration-200 outline-none",
        // Colors — dark bg, zinc border, red neon on focus/hover
        "bg-[oklch(0.09_0.005_0)] border border-[oklch(0.22_0.01_0)]",
        "text-[oklch(0.85_0.005_0)]",
        "data-[placeholder]:text-[oklch(0.45_0.005_0)]",
        "hover:border-[oklch(0.45_0.22_25)] hover:shadow-[0_0_8px_oklch(0.55_0.22_25_/_0.2)]",
        "focus-visible:border-[oklch(0.55_0.22_25)] focus-visible:shadow-[0_0_12px_oklch(0.55_0.22_25_/_0.35)]",
        "data-[state=open]:border-[oklch(0.55_0.22_25)] data-[state=open]:shadow-[0_0_12px_oklch(0.55_0.22_25_/_0.35)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Size variants
        "data-[size=sm]:py-2 data-[size=sm]:px-3 data-[size=sm]:text-xs",
        // SVG chevron
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "[&_svg]:text-[oklch(0.45_0.005_0)]",
        "data-[state=open]:[&_svg]:text-[oklch(0.65_0.22_25)] data-[state=open]:[&_svg]:rotate-180",
        "[&_svg]:transition-transform [&_svg]:duration-200",
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-60" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          // Cyberpunk dropdown panel
          "relative z-50 overflow-hidden rounded-xl",
          "bg-[oklch(0.09_0.005_0)] border border-[oklch(0.25_0.01_0)]",
          "shadow-[0_8px_32px_oklch(0_0_0_/_0.7),_0_0_16px_oklch(0.55_0.22_25_/_0.15)]",
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "max-h-(--radix-select-content-available-height) min-w-[8rem]",
          "origin-(--radix-select-content-transform-origin)",
          "overflow-x-hidden overflow-y-auto",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-2",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-3 py-2 text-xs font-orbitron tracking-widest text-[oklch(0.45_0.005_0)] uppercase",
        className
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // Base
        "relative flex w-full cursor-pointer items-center gap-2 rounded-lg",
        "py-2.5 pr-8 pl-3",
        "text-sm font-rajdhani font-semibold tracking-wider",
        "text-[oklch(0.75_0.005_0)]",
        "outline-none select-none transition-all duration-150",
        // Hover — red neon highlight
        "hover:bg-[oklch(0.55_0.22_25_/_0.12)] hover:text-[oklch(0.92_0.005_0)]",
        // Focus (keyboard navigation)
        "focus:bg-[oklch(0.55_0.22_25_/_0.15)] focus:text-[oklch(0.95_0.005_0)]",
        // Selected state
        "data-[state=checked]:bg-[oklch(0.55_0.22_25_/_0.18)] data-[state=checked]:text-[oklch(0.75_0.28_25)]",
        // Disabled
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-3.5 text-[oklch(0.65_0.22_25)]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-[oklch(0.20_0.01_0)] pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1.5 text-[oklch(0.45_0.005_0)]",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1.5 text-[oklch(0.45_0.005_0)]",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
