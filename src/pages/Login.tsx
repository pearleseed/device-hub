import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Monitor, Laptop, Smartphone, ArrowRight, Loader2, Eye, EyeOff, AlertCircle, Copy, Check } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [copiedCredential, setCopiedCredential] = useState<string | null>(null);
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const demoCredentials = {
    admin: { email: 'alex.johnson@admin.company.com', password: 'demo123' },
    user: { email: 'sarah.chen@company.com', password: 'demo123' }
  };

  const fillDemoCredentials = (type: 'admin' | 'user') => {
    const creds = demoCredentials[type];
    setLoginForm({ username: creds.email, password: creds.password });
    setError('');
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCredential(type);
    setTimeout(() => setCopiedCredential(null), 2000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(loginForm.username, loginForm.password);
    
    setIsLoading(false);
    
    if (result.success) {
      const isAdminEmail = loginForm.username.toLowerCase().includes('@admin.');
      navigate(isAdminEmail ? '/admin' : '/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        
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
                Manage company's<br />devices with ease
              </h1>
              <p className="text-lg text-primary-foreground/70 max-w-md">
                Streamline equipment tracking, borrowing, and returns. 
                Keep team equipped with the tools they need.
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
            <span className="text-xl font-semibold text-foreground">DeviceHub</span>
          </div>

          <Card className="border-0 shadow-none lg:shadow-soft lg:border">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Email</Label>
                  <Input
                    id="username"
                    type="email"
                    placeholder="name@company.com"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto font-normal text-xs text-muted-foreground hover:text-primary"
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
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
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                    Remember me for 30 days
                  </Label>
                </div>
                
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
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

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
                <p className="text-sm font-medium text-foreground">Quick Demo Access:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 flex flex-col items-start"
                    onClick={() => fillDemoCredentials('admin')}
                  >
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">Full access</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 flex flex-col items-start"
                    onClick={() => fillDemoCredentials('user')}
                  >
                    <span className="font-medium">User</span>
                    <span className="text-xs text-muted-foreground">Standard access</span>
                  </Button>
                </div>
                <div className="pt-2 border-t border-border space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Admin email:</span>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-foreground hover:text-primary transition-colors"
                      onClick={() => copyToClipboard(demoCredentials.admin.email, 'admin-email')}
                    >
                      <span className="font-mono truncate max-w-[160px]">{demoCredentials.admin.email}</span>
                      {copiedCredential === 'admin-email' ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">User email:</span>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-foreground hover:text-primary transition-colors"
                      onClick={() => copyToClipboard(demoCredentials.user.email, 'user-email')}
                    >
                      <span className="font-mono truncate max-w-[160px]">{demoCredentials.user.email}</span>
                      {copiedCredential === 'user-email' ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground italic pt-1">Any password works</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
