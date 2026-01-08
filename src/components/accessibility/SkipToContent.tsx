import React from "react";

interface SkipToContentProps {
  targetId?: string;
  children?: React.ReactNode;
}

export const SkipToContent: React.FC<SkipToContentProps> = ({
  targetId = "main-content",
  children = "Skip to main content",
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <a href={`#${targetId}`} onClick={handleClick} className="skip-to-content">
      {children}
    </a>
  );
};
