import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Laptop, Smartphone, ArrowRight, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(loginForm.username, loginForm.password);
    
    setIsLoading(false);
    
    if (result.success) {
      // Redirect based on role (determined by email domain)
      const isAdminEmail = loginForm.username.toLowerCase().includes('@admin.');
      navigate(isAdminEmail ? '/admin' : '/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    // Simulate signup - in real app, this would create the user
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    
    // After signup, auto-login
    const result = await login(signupForm.email, signupForm.password);
    if (result.success) {
      navigate('/dashboard');
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
                Manage your company's<br />devices with ease
              </h1>
              <p className="text-lg text-primary-foreground/70 max-w-md">
                Streamline equipment tracking, borrowing, and returns. 
                Keep your team equipped with the tools they need.
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

      {/* Right Panel - Auth Form */}
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
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
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
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>
                    
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
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
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Demo Credentials:</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Admin:</span> alex.johnson@admin.company.com</p>
                      <p><span className="text-muted-foreground">User:</span> sarah.chen@company.com</p>
                      <p className="text-muted-foreground italic">Any password works</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={signupForm.name}
                        onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
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
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
