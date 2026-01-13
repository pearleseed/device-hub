import React, { memo, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface BreadcrumbNavProps {
  items?: { label: string; href?: string }[];
}

const routeLabels: Record<string, string> = {
  admin: "nav.dashboard", inventory: "nav.inventory", calendar: "nav.calendar",
  requests: "nav.requests", users: "nav.users", settings: "nav.settings",
  dashboard: "nav.dashboard", catalog: "nav.catalog", loans: "nav.myLoans",
  profile: "nav.profile", device: "Device",
};

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = memo(({ items }) => {
  const location = useLocation();
  const { t } = useLanguage();

  const pathSegments = useMemo(() => location.pathname.split("/").filter(Boolean), [location.pathname]);
  const isAdmin = pathSegments[0] === "admin";
  const homePath = isAdmin ? "/admin" : "/dashboard";

  const breadcrumbs = useMemo(() => {
    if (items?.length) return items;
    if (pathSegments.length <= 1) return null;
    
    return pathSegments.map((segment, index) => {
      const labelKey = routeLabels[segment] || segment;
      const label = labelKey.startsWith("nav.") ? t(labelKey) : segment.charAt(0).toUpperCase() + segment.slice(1);
      return {
        label,
        href: index < pathSegments.length - 1 ? "/" + pathSegments.slice(0, index + 1).join("/") : undefined,
      };
    });
  }, [items, pathSegments, t]);

  if (!breadcrumbs) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-muted-foreground mb-4">
      <Link to={homePath} className="hover:text-foreground transition-colors"><Home className="h-4 w-4" /></Link>
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 mx-2 shrink-0" />
          {item.href ? (
            <Link to={item.href} className="hover:text-foreground transition-colors">{item.label}</Link>
          ) : (
            <span className={cn("text-foreground font-medium", items && "truncate max-w-[200px]")}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
});
