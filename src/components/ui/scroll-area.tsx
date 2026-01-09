import * as React from "react";

import { cn } from "@/lib/utils";

// Native scroll area implementation optimized for React 19
// Uses modern ref as prop pattern instead of forwardRef

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "auto" | "always" | "scroll" | "hover";
  scrollHideDelay?: number;
  dir?: "ltr" | "rtl";
  asChild?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

function ScrollArea({ className, children, ref, ...props }: ScrollAreaProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-auto",
        // Custom scrollbar styling with smooth transitions
        "[&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar]:h-2.5",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full",
        "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40",
        "[&::-webkit-scrollbar-corner]:bg-transparent",
        // Firefox scrollbar styling
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
ScrollArea.displayName = "ScrollArea";

// Viewport is just a pass-through div
interface ViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

function ScrollAreaViewport({
  className,
  children,
  ref,
  ...props
}: ViewportProps) {
  return (
    <div ref={ref} className={cn("h-full w-full", className)} {...props}>
      {children}
    </div>
  );
}
ScrollAreaViewport.displayName = "ScrollAreaViewport";

interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal";
  forceMount?: boolean;
  asChild?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

// ScrollBar is a no-op since we use native scrollbars
function ScrollAreaScrollbar({ ref, ...props }: ScrollBarProps) {
  return <div ref={ref} {...props} style={{ display: "none" }} />;
}
ScrollAreaScrollbar.displayName = "ScrollAreaScrollbar";

// Thumb is a no-op
interface ThumbProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

function ScrollAreaThumb({ ref, ...props }: ThumbProps) {
  return <div ref={ref} {...props} style={{ display: "none" }} />;
}
ScrollAreaThumb.displayName = "ScrollAreaThumb";

// Corner is a no-op
interface CornerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

function ScrollAreaCorner({ ref, ...props }: CornerProps) {
  return <div ref={ref} {...props} style={{ display: "none" }} />;
}
ScrollAreaCorner.displayName = "ScrollAreaCorner";

// Legacy exports for app's usage
const ScrollBar = ScrollAreaScrollbar;

export {
  ScrollArea,
  ScrollBar,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner,
};
