import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import {
  Monitor,
  LogOut,
  User,
  LayoutDashboard,
  Package,
  Menu,
  X,
} from "lucide-react";

const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/catalog", label: "Catalog", icon: Package },
];

export const UserNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="container flex h-14 items-center px-4 md:px-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Monitor className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg hidden sm:inline-block">
            DeviceHub
          </span>
        </Link>

        {/* Spacer Left */}
        <div className="flex-1" />

        {/* Desktop Navigation - Tab Style - Centered */}
        <nav className="hidden md:flex items-center bg-muted/50 rounded-lg p-1">
          {navLinks.map((link) => {
            const isActive =
              location.pathname === link.to ||
              (link.to === "/catalog" &&
                location.pathname.startsWith("/device/"));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer Right */}
        <div className="flex-1" />

        {/* Right Section */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <NotificationCenter />

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-3">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
