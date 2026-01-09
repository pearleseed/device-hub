import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
} from "lucide-react";

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

const navItems = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/admin" },
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
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo & Actions */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <Monitor className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg">DeviceHub</span>
          )}
        </div>
        {!collapsed && <NotificationCenter />}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/50",
                collapsed && "justify-center",
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-r-full" />
              )}
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t(item.labelKey)}</span>}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {t(item.labelKey)}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className={cn(
            "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed ? "justify-center" : "justify-start",
          )}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span className="ml-2">Collapse</span>
            </>
          )}
        </Button>
      </div>

      {/* Theme & Language Toggle */}
      <div
        className={cn(
          "flex items-center px-3 py-2 border-t border-sidebar-border",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {collapsed ? (
          <div className="flex flex-col gap-2">
            <ThemeToggle />
          </div>
        ) : (
          <>
            <LanguageToggle />
            <ThemeToggle />
          </>
        )}
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3 mb-3",
            collapsed && "justify-center",
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {t("users.admin")}
              </p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            "w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center",
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">{t("common.logout")}</span>}
        </Button>
      </div>
    </aside>
  );
};
