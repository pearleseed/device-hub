import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Monitor,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Copy,
  Check,
  Shield,
  Users,
  CheckCircle2,
} from "lucide-react";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { InteractiveBackground } from "@/components/ui/interactive-background";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, clearMustChangePassword } = useAuth();
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [copiedCredential, setCopiedCredential] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );

  // Get particle color from CSS variable for smooth theme transitions
  const particleColor =
    resolvedTheme === "dark"
      ? "rgba(148, 163, 184, 0.5)"
      : "rgba(255, 255, 255, 0.4)";

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  const demoCredentials = {
    admin: { email: "superuser@company.com", password: "password123" },
    user: { email: "sarah.chen@company.com", password: "password123" },
  };

  const fillDemoCredentials = (type: "admin" | "user") => {
    const creds = demoCredentials[type];
    setLoginForm({ username: creds.email, password: creds.password });
    setError("");
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCredential(type);
    setTimeout(() => setCopiedCredential(null), 2000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(loginForm.username, loginForm.password, rememberMe);

    setIsLoading(false);

    if (result.success) {
      const isAdminEmail = loginForm.username.toLowerCase().includes("@admin.");
      const targetPath = isAdminEmail ? "/admin" : "/dashboard";

      // Check if password change is required
      if (result.mustChangePassword) {
        setPendingNavigation(targetPath);
        setShowChangePasswordModal(true);
      } else {
        navigate(targetPath);
      }
    } else {
      setError(result.error || t("error.loginFailed"));
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowChangePasswordModal(false);
    clearMustChangePassword();
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  return (
    <div className="min-h-screen flex" role="main" aria-label="Login page">
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden login-hero-panel"
        aria-hidden="true"
      >
        {/* Interactive particle background */}
        <InteractiveBackground
          particleCount={60}
          particleColor={particleColor}
          maxDistance={120}
        />

        {/* Subtle background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl login-hero-glow" />
          <div className="absolute bottom-20 left-20 w-72 h-72 rounded-full blur-3xl login-hero-glow" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full pointer-events-none login-hero-text">
          {/* Header */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="h-11 w-11 rounded-xl backdrop-blur-sm flex items-center justify-center login-hero-icon-bg border">
              <Monitor className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">{t("common.brandName")}</span>
          </div>

          {/* Main content - Centered */}
          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              {t("loginPage.heroTitleLine1")}
              <br />
              <span className="login-hero-text-muted">
                {t("loginPage.heroTitleLine2")}
              </span>
            </h1>
            <p className="text-base leading-relaxed login-hero-text-muted">
              {t("loginPage.trackBookManage")}
            </p>

            {/* Key highlights - Simple list with staggered animation */}
            <div className="space-y-3 pt-4">
              <div
                className="flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: "0.1s", animationFillMode: "both" }}
              >
                <CheckCircle2 className="h-5 w-5 login-hero-text-muted" />
                <span className="text-sm opacity-90">
                  {t("loginPage.realTimeTracking")}
                </span>
              </div>
              <div
                className="flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: "0.2s", animationFillMode: "both" }}
              >
                <CheckCircle2 className="h-5 w-5 login-hero-text-muted" />
                <span className="text-sm opacity-90">
                  {t("loginPage.easyBooking")}
                </span>
              </div>
              <div
                className="flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: "0.3s", animationFillMode: "both" }}
              >
                <CheckCircle2 className="h-5 w-5 login-hero-text-muted" />
                <span className="text-sm opacity-90">
                  {t("loginPage.analyticsReports")}
                </span>
              </div>
            </div>
          </div>

          {/* Footer - Minimal */}
          <div className="flex items-center gap-6 text-sm login-hero-text-muted opacity-60">
            <span>{t("login.laptops")}</span>
            <span>•</span>
            <span>{t("login.mobile")}</span>
            <span>•</span>
            <span>{t("login.monitors")}</span>
            <span>•</span>
            <span>{t("loginPage.accessories")}</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 bg-background relative">
        {/* Theme Toggle - Top Right */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center">
              <Monitor className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-foreground">
                {t("common.brandName")}
              </span>
              <p className="text-sm text-muted-foreground">
                {t("loginPage.enterpriseDeviceManagement")}
              </p>
            </div>
          </div>

          <Card className="border-0 shadow-none lg:shadow-lg lg:border">
            <CardHeader className="space-y-2 text-center pb-2">
              <CardTitle className="text-2xl font-bold">
                {t("login.welcomeBack")}
              </CardTitle>
              <CardDescription>{t("loginPage.signInToManage")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username">{t("login.email")}</Label>
                  <Input
                    id="username"
                    type="email"
                    placeholder="name@company.com"
                    value={loginForm.username}
                    onChange={(e) =>
                      setLoginForm({
                        ...loginForm,
                        username: e.target.value,
                      })
                    }
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("login.password")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm({
                          ...loginForm,
                          password: e.target.value,
                        })
                      }
                      required
                      className="h-12 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? t("login.hidePassword")
                          : t("login.showPassword")
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal cursor-pointer"
                  >
                    {t("login.rememberMe")}
                  </Label>
                </div>

                {error && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 mt-2"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <>
                      {t("login.signIn")}
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </form>

              {/* Demo Credentials - Redesigned */}
              <div className="mt-6 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t("login.quickDemoAccess")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials("admin")}
                    className="group relative p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                    aria-label={`${t("login.admin")} - ${t("login.fullAccess")}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Shield
                          className="h-5 w-5 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm">
                          {t("login.admin")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("login.fullAccess")}
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials("user")}
                    className="group relative p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                    aria-label={`${t("login.user")} - ${t("login.standardAccess")}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Users
                          className="h-5 w-5 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm">
                          {t("login.user")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("login.standardAccess")}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("login.admin")}:
                    </span>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors font-mono text-xs"
                      onClick={() =>
                        copyToClipboard(
                          demoCredentials.admin.email,
                          "admin-email",
                        )
                      }
                    >
                      <span className="truncate max-w-[180px]">
                        {demoCredentials.admin.email}
                      </span>
                      {copiedCredential === "admin-email" ? (
                        <Check className="h-3 w-3 text-green-500 shrink-0" />
                      ) : (
                        <Copy className="h-3 w-3 shrink-0" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("login.user")}:
                    </span>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors font-mono text-xs"
                      onClick={() =>
                        copyToClipboard(
                          demoCredentials.user.email,
                          "user-email",
                        )
                      }
                    >
                      <span className="truncate max-w-[180px]">
                        {demoCredentials.user.email}
                      </span>
                      {copiedCredential === "user-email" ? (
                        <Check className="h-3 w-3 text-green-500 shrink-0" />
                      ) : (
                        <Copy className="h-3 w-3 shrink-0" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Force Password Change Modal */}
      <ChangePasswordModal
        open={showChangePasswordModal}
        onSuccess={handlePasswordChangeSuccess}
        isForced={true}
      />
    </div>
  );
};

export default Login;
