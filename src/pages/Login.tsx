import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, departments } from "@/contexts/AuthContext";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Monitor,
  Laptop,
  Smartphone,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Copy,
  Check,
  UserPlus,
} from "lucide-react";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [copiedCredential, setCopiedCredential] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    department: "",
    password: "",
    confirmPassword: "",
  });

  const demoCredentials = {
    admin: { email: "alex.johnson@admin.company.com", password: "password123" },
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

    const result = await login(loginForm.username, loginForm.password);

    setIsLoading(false);

    if (result.success) {
      const isAdminEmail = loginForm.username.toLowerCase().includes("@admin.");
      navigate(isAdminEmail ? "/admin" : "/dashboard");
    } else {
      setError(result.error || "Login failed");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password match
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (signupForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    const result = await register({
      name: signupForm.name,
      email: signupForm.email,
      department: signupForm.department,
      password: signupForm.password,
    });

    setIsLoading(false);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Registration failed");
    }
  };

  const clearError = () => setError("");

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary/80" />

        {/* Abstract tech pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-primary-foreground/30 rounded-full" />
          <div className="absolute top-40 left-40 w-96 h-96 border border-primary-foreground/20 rounded-full" />
          <div className="absolute bottom-20 right-20 w-80 h-80 border border-primary-foreground/25 rounded-full" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-primary-foreground">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                <Monitor className="h-6 w-6" />
              </div>
              <span className="text-xl font-semibold">DeviceHub</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight">
                Manage company's
                <br />
                devices with ease
              </h1>
              <p className="text-lg text-primary-foreground/70 max-w-md">
                Streamline equipment tracking, borrowing, and returns. Keep team
                equipped with the tools they need.
              </p>
            </div>

            {/* Floating device icons */}
            <div className="flex gap-6 pt-8">
              <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-lg px-4 py-2">
                <Laptop className="h-5 w-5" />
                <span className="text-sm">Laptops</span>
              </div>
              <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-lg px-4 py-2">
                <Smartphone className="h-5 w-5" />
                <span className="text-sm">Mobile</span>
              </div>
              <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-lg px-4 py-2">
                <Monitor className="h-5 w-5" />
                <span className="text-sm">Monitors</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Monitor className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              DeviceHub
            </span>
          </div>

          <Card className="border-0 shadow-none lg:shadow-soft lg:border">
            <CardHeader className="space-y-2 text-center pb-2">
              <CardTitle className="text-2xl font-bold">
                {activeTab === "signin" ? "Welcome back" : "Create an account"}
              </CardTitle>
              <CardDescription>
                {activeTab === "signin"
                  ? "Enter your credentials to access your account"
                  : "Enter your details to get started"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {activeTab === "signin" ? (
                <>
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="username">Email</Label>
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
                      <Label htmlFor="password">Password</Label>
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
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
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
                        Remember me for 30 days
                      </Label>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12 mt-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => {
                        setActiveTab("signup");
                        clearError();
                      }}
                    >
                      Sign Up
                    </button>
                  </p>

                  {/* Demo Credentials */}
                  <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      Quick Demo Access:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto py-2 flex flex-col items-start"
                        onClick={() => fillDemoCredentials("admin")}
                      >
                        <span className="font-medium">Admin</span>
                        <span className="text-xs text-muted-foreground">
                          Full access
                        </span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto py-2 flex flex-col items-start"
                        onClick={() => fillDemoCredentials("user")}
                      >
                        <span className="font-medium">User</span>
                        <span className="text-xs text-muted-foreground">
                          Standard access
                        </span>
                      </Button>
                    </div>
                    <div className="pt-2 border-t border-border space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Admin email:
                        </span>
                        <button
                          type="button"
                          className="flex items-center gap-1 text-foreground hover:text-primary transition-colors"
                          onClick={() =>
                            copyToClipboard(
                              demoCredentials.admin.email,
                              "admin-email",
                            )
                          }
                        >
                          <span className="font-mono truncate max-w-[160px]">
                            {demoCredentials.admin.email}
                          </span>
                          {copiedCredential === "admin-email" ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          User email:
                        </span>
                        <button
                          type="button"
                          className="flex items-center gap-1 text-foreground hover:text-primary transition-colors"
                          onClick={() =>
                            copyToClipboard(
                              demoCredentials.user.email,
                              "user-email",
                            )
                          }
                        >
                          <span className="font-mono truncate max-w-[160px]">
                            {demoCredentials.user.email}
                          </span>
                          {copiedCredential === "user-email" ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground italic pt-1">
                        Any password works
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={signupForm.name}
                        onChange={(e) =>
                          setSignupForm({ ...signupForm, name: e.target.value })
                        }
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@company.com"
                        value={signupForm.email}
                        onChange={(e) =>
                          setSignupForm({
                            ...signupForm,
                            email: e.target.value,
                          })
                        }
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-department">Department</Label>
                      <Select
                        value={signupForm.department}
                        onValueChange={(value) =>
                          setSignupForm({ ...signupForm, department: value })
                        }
                        required
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select your department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signupForm.password}
                          onChange={(e) =>
                            setSignupForm({
                              ...signupForm,
                              password: e.target.value,
                            })
                          }
                          required
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Must be at least 6 characters
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signupForm.confirmPassword}
                          onChange={(e) =>
                            setSignupForm({
                              ...signupForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          required
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={isLoading || !signupForm.department}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </form>

                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => {
                        setActiveTab("signin");
                        clearError();
                      }}
                    >
                      Sign In
                    </button>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
