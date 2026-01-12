import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SkipToContentProps {
  targetId?: string;
  children?: React.ReactNode;
}

export const SkipToContent: React.FC<SkipToContentProps> = ({
  targetId = "main-content",
  children,
}) => {
  const { t } = useLanguage();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="skip-to-content"
      tabIndex={0}
    >
      {children || t("accessibility.skipToContent")}
    </a>
  );
};
