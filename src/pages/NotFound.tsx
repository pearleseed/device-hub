import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  const homeLink = isAuthenticated
    ? isAdmin
      ? "/admin"
      : "/dashboard"
    : "/login";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center p-6"
        role="main"
        aria-labelledby="error-title"
      >
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Animated 404 Visual */}
          <div className="relative">
            {/* Background circles for depth */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full bg-primary/5 animate-pulse" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-primary/10" />
            </div>

            {/* 404 Number */}
            <div className="relative z-10 py-8">
              <span
                className="text-[120px] sm:text-[160px] font-bold leading-none tracking-tighter text-primary/10 select-none"
                aria-hidden="true"
              >
                404
              </span>
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-3 animate-fade-in">
            <h1
              id="error-title"
              className="text-2xl sm:text-3xl font-bold text-foreground"
            >
              {t("notFound.title")}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
              {t("notFound.description")} {t("notFoundPage.letsGetYouBack")}
            </p>
            {location.pathname && (
              <p className="text-sm text-muted-foreground/70 font-mono bg-muted px-3 py-1.5 rounded-md inline-block">
                {location.pathname}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={homeLink}>
                <Home className="mr-2 h-4 w-4" />
                {t("notFound.goHome")}{" "}
                {isAuthenticated ? t("nav.dashboard") : t("common.home")}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link to="#" onClick={() => window.history.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("notFound.goBack")}
              </Link>
            </Button>
          </div>

          {/* Quick Links */}
          {isAuthenticated && (
            <div className="pt-6 border-t border-border animate-fade-in">
              <p className="text-sm text-muted-foreground mb-4">
                {t("notFound.orTryThese")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/catalog">
                    <Search className="mr-1.5 h-3.5 w-3.5" />
                    {t("notFound.browseCatalog")}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/profile">
                    <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
                    {t("notFound.myProfile")}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t("notFound.needHelp")}{" "}
          <a
            href="mailto:support@company.com"
            className="text-primary hover:underline underline-offset-4 transition-colors"
          >
            {t("notFound.contactSupport")}
          </a>
        </p>
      </footer>
    </div>
  );
};

export default NotFound;
