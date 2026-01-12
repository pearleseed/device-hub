import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface BreadcrumbItem {
  label: string;
  path?: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items?: { label: string; href?: string }[];
}

const routeLabels: Record<string, string> = {
  admin: "nav.dashboard",
  inventory: "nav.inventory",
  calendar: "nav.calendar",
  requests: "nav.requests",
  users: "nav.users",
  settings: "nav.settings",
  dashboard: "nav.dashboard",
  catalog: "nav.catalog",
  profile: "nav.profile",
  device: "Device",
};

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items }) => {
  const location = useLocation();
  const { t } = useLanguage();

  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Use custom items if provided
  if (items && items.length > 0) {
    const isAdmin = pathSegments[0] === "admin";

    return (
      <nav
        aria-label="Breadcrumb"
        className="flex items-center text-sm text-muted-foreground mb-4"
      >
        <Link
          to={isAdmin ? "/admin" : "/dashboard"}
          className="hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
        </Link>

        {items.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 mx-2 shrink-0" />
            {item.href ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "text-foreground font-medium truncate max-w-[200px]",
                )}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  }

  if (pathSegments.length <= 1) {
    return null; // Don't show breadcrumbs on root pages
  }

  const breadcrumbs: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const labelKey = routeLabels[segment] || segment;
    const label = labelKey.startsWith("nav.")
      ? t(labelKey)
      : segment.charAt(0).toUpperCase() + segment.slice(1);

    return {
      label,
      path: index < pathSegments.length - 1 ? path : undefined, // Last item has no link
    };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center text-sm text-muted-foreground mb-4"
    >
      <Link
        to={pathSegments[0] === "admin" ? "/admin" : "/dashboard"}
        className="hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 mx-2 shrink-0" />
          {item.path ? (
            <Link
              to={item.path}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn("text-foreground font-medium")}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
