import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { LanguageSelector } from "@/components/ui/language-selector";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useBorrowRequests, useRenewals } from "@/hooks/use-api-queries";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  LogOut,
  Monitor,
  CalendarDays,
  PanelLeftClose,
  PanelLeft,
  BarChart3,
  Crown,
  ShieldCheck,
} from "lucide-react";

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

const navItems = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/admin" },
  { icon: BarChart3, labelKey: "nav.analytics", path: "/admin/analytics" },
  { icon: Package, labelKey: "nav.inventory", path: "/admin/inventory" },
  { icon: CalendarDays, labelKey: "nav.calendar", path: "/admin/calendar" },
  { icon: ClipboardList, labelKey: "nav.requests", path: "/admin/requests" },
  { icon: Users, labelKey: "nav.users", path: "/admin/users" },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed: controlledCollapsed,
  onToggle,
}) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  
  // Fetch request counts for the badge
  const { data: borrowRequests } = useBorrowRequests();
  const { data: renewalRequests } = useRenewals();
  
  // Calculate total pending requests count (borrow + renewal requests)
  const pendingRequestsCount = useMemo(() => {
    const pendingBorrows = borrowRequests?.filter(r => r.status === "pending").length || 0;
    const pendingRenewals = renewalRequests?.filter(r => r.status === "pending").length || 0;
    return pendingBorrows + pendingRenewals;
  }, [borrowRequests, renewalRequests]);

  // Use localStorage for persistence when not controlled
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return saved === "true";
    }
    return false;
  });

  const collapsed = controlledCollapsed ?? internalCollapsed;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      const newValue = !internalCollapsed;
      setInternalCollapsed(newValue);
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
    }
  };

  // Persist controlled state too
  useEffect(() => {
    if (controlledCollapsed !== undefined) {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(controlledCollapsed));
    }
  }, [controlledCollapsed]);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 sticky top-0 shrink-0 z-50",
        // Responsive width: scale up on larger screens
        collapsed ? "w-14 lg:w-16" : "w-56 lg:w-60 xl:w-64",
      )}
      role="navigation"
      aria-label={t("nav.adminNavigation")}
    >
      {/* Logo & Actions */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-sidebar-border h-14 lg:h-16">
        <div className="flex items-center gap-2 lg:gap-2.5">
          <div className="h-7 w-7 lg:h-8 lg:w-8 rounded-md bg-sidebar-primary flex items-center justify-center shrink-0">
            <Monitor
              className="h-4 w-4 lg:h-5 lg:w-5 text-sidebar-primary-foreground"
              aria-hidden="true"
            />
          </div>
          {!collapsed && (
            <span className="font-semibold text-base lg:text-lg">
              {t("common.brandName")}
            </span>
          )}
        </div>
        {!collapsed && <NotificationCenter />}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-2 py-2 lg:py-3 space-y-0.5 lg:space-y-1"
        aria-label={t("nav.adminMenu")}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isRequestsItem = item.path === "/admin/requests";
          const showBadge = isRequestsItem && pendingRequestsCount > 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2.5 lg:gap-3 px-2.5 lg:px-3 py-2 lg:py-2.5 rounded-md transition-colors relative group text-sm lg:text-base",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/50",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 lg:h-6 bg-sidebar-primary rounded-r-full"
                  aria-hidden="true"
                />
              )}
              <item.icon
                className="h-4 w-4 lg:h-5 lg:w-5 shrink-0"
                aria-hidden="true"
              />
              {!collapsed && (
                <span className="flex-1">{t(item.labelKey)}</span>
              )}
              
              {/* Pending requests badge */}
              {showBadge && (
                <Badge 
                  variant="destructive" 
                  className={cn(
                    "h-5 min-w-5 px-1.5 text-[10px] font-semibold flex items-center justify-center",
                    collapsed && "absolute -top-1 -right-1"
                  )}
                  aria-label={`${pendingRequestsCount} pending requests`}
                >
                  {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
                </Badge>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div
                  className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs lg:text-sm rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-9999"
                  role="tooltip"
                >
                  {t(item.labelKey)}
                  {showBadge && ` (${pendingRequestsCount})`}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-2 pb-1.5 lg:pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="w-full h-8 lg:h-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent justify-start text-xs lg:text-sm"
          aria-expanded={!collapsed}
          aria-label={
            collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")
          }
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4 lg:h-5 lg:w-5" aria-hidden="true" />
          ) : (
            <>
              <PanelLeftClose
                className="h-4 w-4 lg:h-5 lg:w-5"
                aria-hidden="true"
              />
              <span className="ml-2">{t("nav.collapse")}</span>
            </>
          )}
        </Button>
      </div>

      {/* Theme & Language Toggle */}
      <div className="flex items-center px-2 lg:px-3 py-1.5 lg:py-2 border-t border-sidebar-border justify-between">
        {collapsed ? (
          <ThemeToggle />
        ) : (
          <>
            <LanguageSelector />
            <ThemeToggle />
          </>
        )}
      </div>

      {/* User Section */}
      <div className="p-2 lg:p-3 border-t border-sidebar-border">
        <Link
          to="/admin/profile"
          className={cn(
            "flex items-center gap-2 lg:gap-2.5 p-1.5 -m-1.5 rounded-md transition-colors",
            "hover:bg-sidebar-accent/50 cursor-pointer",
            location.pathname === "/admin/profile" && "bg-sidebar-accent",
          )}
        >
          <Avatar className="h-8 w-8 lg:h-9 lg:w-9 shrink-0 ring-2 ring-transparent hover:ring-primary/20 transition-all">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="text-xs lg:text-sm">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-medium truncate">
                {user?.name}
              </p>
              <Badge
                variant={user?.role === "superuser" ? "default" : "secondary"}
                className="mt-0.5 gap-0.5 text-[9px] lg:text-[10px] py-0 px-1.5"
              >
                {user?.role === "superuser" ? (
                  <>
                    <Crown className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                    {t("adminUsers.superuser")}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                    {t("users.admin")}
                  </>
                )}
              </Badge>
            </div>
          )}
          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs lg:text-sm rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-9999">
              {t("nav.profile")}
            </div>
          )}
        </Link>

        <div className="my-3 border-t border-sidebar-border/50" />

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full h-8 lg:h-9 justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent text-xs lg:text-sm"
          aria-label={t("common.logout")}
        >
          <LogOut
            className="h-4 w-4 lg:h-5 lg:w-5 shrink-0"
            aria-hidden="true"
          />
          {!collapsed && <span className="ml-2">{t("common.logout")}</span>}
        </Button>
      </div>
    </aside>
  );
};
