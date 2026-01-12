import * as React from "react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { countGraphemes, truncateToGraphemes } from "@/lib/textUtils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: React.Ref<HTMLTextAreaElement>;
  maxGraphemes?: number; // Character limit based on grapheme clusters
  showCount?: boolean; // Show character count
}

// React 19: ref is now a regular prop
function Textarea({
  className,
  ref,
  maxGraphemes,
  showCount,
  onChange,
  value,
  defaultValue,
  ...props
}: TextareaProps) {
  // Track internal value for uncontrolled components using state with lazy initializer
  const [internalValue, setInternalValue] = React.useState<string>(() => {
    if (defaultValue !== undefined) {
      return String(defaultValue);
    }
    return "";
  });

  // Compute character count directly from value/internalValue (no effect needed)
  const charCount = useMemo(() => {
    if (value !== undefined) {
      return countGraphemes(String(value));
    }
    return countGraphemes(internalValue);
  }, [value, internalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;

    if (maxGraphemes) {
      const graphemeCount = countGraphemes(newValue);
      if (graphemeCount > maxGraphemes) {
        // Truncate to max graphemes
        newValue = truncateToGraphemes(newValue, maxGraphemes);
        e.target.value = newValue;
      }
    }

    // Update internal value for uncontrolled components
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(e);
  };

  const textarea = (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      {...props}
    />
  );

  if (showCount) {
    return (
      <div className="relative">
        {textarea}
        <div className="mt-1 text-xs text-muted-foreground text-right">
          {charCount}
          {maxGraphemes ? ` / ${maxGraphemes}` : ""} characters
        </div>
      </div>
    );
  }

  return textarea;
}
Textarea.displayName = "Textarea";

export { Textarea, type TextareaProps };
