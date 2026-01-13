import React, { useState, memo, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";
import { cn } from "@/lib/utils";
import { Monitor, LogOut, User, LayoutDashboard, Package, Menu, X, ArrowLeftRight } from "lucide-react";

const navLinks = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/catalog", labelKey: "nav.catalog", icon: Package },
  { to: "/loans", labelKey: "nav.myLoans", icon: ArrowLeftRight },
];

export const UserNavbar: React.FC = memo(() => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((prev) => !prev), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const navItems = useMemo(() => navLinks.map((link) => ({
    ...link,
    isActive: location.pathname === link.to || (link.to === "/catalog" && location.pathname.startsWith("/device/")),
  })), [location.pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm" role="banner">
      <div className="container flex h-14 items-center px-4 md:px-6">
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0" aria-label={`${t("common.brandName")} - ${t("nav.dashboard")}`}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Monitor className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <span className="font-semibold text-lg hidden sm:inline-block">{t("common.brandName")}</span>
        </Link>

        <div className="flex-1" />

        <nav className="hidden md:flex items-center bg-muted/50 rounded-lg p-1" role="navigation" aria-label={t("nav.mainNavigation")}>
          {navItems.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                link.isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={link.isActive ? "page" : undefined}
            >
              <link.icon className="h-4 w-4" aria-hidden="true" />{t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <LanguageSelector variant="compact" />
          <ThemeToggle />
          <NotificationCenter />

          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}>
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label={t("nav.userMenu")}>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar_url} alt={user?.name || t("users.user")} />
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer"><User className="mr-2 h-4 w-4" aria-hidden="true" />{t("common.profile")}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />{t("common.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-3" id="mobile-navigation">
          <nav className="flex flex-col gap-1" role="navigation" aria-label={t("nav.mobileNavigation")}>
            {navItems.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  link.isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
                aria-current={link.isActive ? "page" : undefined}
              >
                <link.icon className="h-5 w-5" aria-hidden="true" />{t(link.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
});
