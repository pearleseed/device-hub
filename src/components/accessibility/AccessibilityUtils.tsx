import React, { useEffect, useState } from "react";

// Hook to announce messages to screen readers
// eslint-disable-next-line react-refresh/only-export-components
export const useAnnounce = () => {
  const announce = (
    message: string,
    priority: "polite" | "assertive" = "polite",
  ) => {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announce };
};

// Component for live region announcements
interface LiveRegionProps {
  message: string;
  priority?: "polite" | "assertive";
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = "polite",
}) => {
  // Simple implementation: just render the message directly
  // The parent component should control when to clear/update the message
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

// Hook for keyboard navigation
// eslint-disable-next-line react-refresh/only-export-components
export const useKeyboardNavigation = (
  items: HTMLElement[] | null,
  options?: {
    orientation?: "horizontal" | "vertical" | "both";
    loop?: boolean;
    onSelect?: (index: number) => void;
  },
) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const { orientation = "vertical", loop = true, onSelect } = options || {};

  useEffect(() => {
    if (!items || items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isVertical = orientation === "vertical" || orientation === "both";
      const isHorizontal =
        orientation === "horizontal" || orientation === "both";

      let newIndex = focusedIndex;

      switch (e.key) {
        case "ArrowDown":
          if (isVertical) {
            e.preventDefault();
            newIndex = focusedIndex + 1;
          }
          break;
        case "ArrowUp":
          if (isVertical) {
            e.preventDefault();
            newIndex = focusedIndex - 1;
          }
          break;
        case "ArrowRight":
          if (isHorizontal) {
            e.preventDefault();
            newIndex = focusedIndex + 1;
          }
          break;
        case "ArrowLeft":
          if (isHorizontal) {
            e.preventDefault();
            newIndex = focusedIndex - 1;
          }
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = items.length - 1;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onSelect?.(focusedIndex);
          return;
        default:
          return;
      }

      // Handle looping
      if (loop) {
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
      } else {
        newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
      }

      setFocusedIndex(newIndex);
      items[newIndex]?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [items, focusedIndex, orientation, loop, onSelect]);

  return { focusedIndex, setFocusedIndex };
};

// Accessible loading state
interface AccessibleLoadingProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const AccessibleLoading: React.FC<AccessibleLoadingProps> = ({
  isLoading,
  loadingText = "Loading...",
  children,
}) => {
  return (
    <div aria-busy={isLoading} aria-live="polite">
      {isLoading ? (
        <div role="status">
          <span className="sr-only">{loadingText}</span>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};
