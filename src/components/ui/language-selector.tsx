import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n";

interface LanguageSelectorProps {
  variant?: "default" | "compact";
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = "default",
  className,
}) => {
  const { language, setLanguage, languages, t } = useLanguage();
  const currentLang = languages[language];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "compact" ? "icon" : "sm"}
          className={cn("gap-2", className)}
          aria-label={t("language.select")}
        >
          <Languages className="h-4 w-4" />
          {variant === "default" && (
            <span className="text-xs font-medium">
              {currentLang.flag} {currentLang.nativeName}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {(Object.entries(languages) as [Language, typeof currentLang][]).map(
          ([code, info]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => setLanguage(code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span>{info.flag}</span>
                <span>{info.nativeName}</span>
              </span>
              {language === code && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
