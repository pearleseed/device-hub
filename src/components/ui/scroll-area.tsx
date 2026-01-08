import * as React from "react";

import { cn } from "@/lib/utils";

// Native scroll area implementation to avoid React 19 compatibility issues
// with @radix-ui/react-scroll-area's ref handling

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "auto" | "always" | "scroll" | "hover";
  scrollHideDelay?: number;
  dir?: "ltr" | "rtl";
  asChild?: boolean;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      className,
      children,
      type: _type,
      scrollHideDelay: _scrollHideDelay,
      dir: _dir,
      asChild: _asChild,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "relative overflow-auto",
        // Custom scrollbar styling
        "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full",
        "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
ScrollArea.displayName = "ScrollArea";

// Viewport is just a pass-through div
interface ViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const ScrollAreaViewport = React.forwardRef<HTMLDivElement, ViewportProps>(
  ({ className, children, asChild: _asChild, ...props }, ref) => (
    <div ref={ref} className={cn("h-full w-full", className)} {...props}>
      {children}
    </div>
  ),
);
ScrollAreaViewport.displayName = "ScrollAreaViewport";

interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal";
  forceMount?: boolean;
  asChild?: boolean;
}

// ScrollBar is a no-op since we use native scrollbars
const ScrollAreaScrollbar = React.forwardRef<HTMLDivElement, ScrollBarProps>(
  (
    {
      className: _className,
      orientation: _orientation,
      forceMount: _forceMount,
      asChild: _asChild,
      ...props
    },
    ref,
  ) => <div ref={ref} {...props} style={{ display: "none" }} />,
);
ScrollAreaScrollbar.displayName = "ScrollAreaScrollbar";

// Thumb is a no-op
interface ThumbProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const ScrollAreaThumb = React.forwardRef<HTMLDivElement, ThumbProps>(
  ({ asChild: _asChild, ...props }, ref) => (
    <div ref={ref} {...props} style={{ display: "none" }} />
  ),
);
ScrollAreaThumb.displayName = "ScrollAreaThumb";

// Corner is a no-op
interface CornerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const ScrollAreaCorner = React.forwardRef<HTMLDivElement, CornerProps>(
  ({ asChild: _asChild, ...props }, ref) => (
    <div ref={ref} {...props} style={{ display: "none" }} />
  ),
);
ScrollAreaCorner.displayName = "ScrollAreaCorner";

// Legacy exports for our app's usage
const ScrollBar = ScrollAreaScrollbar;

// Root export for Radix compatibility
const Root = ScrollArea;
const Viewport = ScrollAreaViewport;
const Scrollbar = ScrollAreaScrollbar;
const Thumb = ScrollAreaThumb;
const Corner = ScrollAreaCorner;

export {
  ScrollArea,
  ScrollBar,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner,
  // Radix-style exports
  Root,
  Viewport,
  Scrollbar,
  Thumb,
  Corner,
};
