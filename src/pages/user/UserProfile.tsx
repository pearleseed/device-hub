import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserNavbar } from "@/components/layout/UserNavbar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getRequestsByUser, getDeviceById } from "@/lib/mockData";
import { StatsCard } from "@/components/ui/stats-card";
import { SkeletonKPICard, SkeletonAvatar } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Building2,
  Calendar,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
  Activity,
  History,
  Shield,
  Sparkles,
  MapPin,
  Key,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const userId = user?.id || "2";
  const userRequests = getRequestsByUser(userId);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate comprehensive stats
  const stats = {
    totalRequests: userRequests.length,
    activeLoans: userRequests.filter((r) => r.status === "active").length,
    pendingRequests: userRequests.filter((r) => r.status === "pending").length,
    completedLoans: userRequests.filter((r) => r.status === "returned").length,
    approvedRequests: userRequests.filter(
      (r) =>
        r.status === "approved" ||
        r.status === "active" ||
        r.status === "returned"
    ).length,
    rejectedRequests: userRequests.filter((r) => r.status === "rejected").length,
  };

  const approvalRate =
    stats.totalRequests > 0
      ? Math.round((stats.approvedRequests / stats.totalRequests) * 100)
      : 0;

  // Get unique categories borrowed
  const categoriesBorrowed = [
    ...new Set(
      userRequests
        .map((r) => getDeviceById(r.deviceId)?.category)
        .filter(Boolean)
    ),
  ];

  // Calculate average loan duration
  const completedLoans = userRequests.filter((r) => r.status === "returned");
  const avgLoanDuration =
    completedLoans.length > 0
      ? Math.round(
          completedLoans.reduce((acc, loan) => {
            return (
              acc +
              differenceInDays(new Date(loan.endDate), new Date(loan.startDate))
            );
          }, 0) / completedLoans.length
        )
      : 0;

  // Recent activity (last 5 requests)
  const recentActivity = userRequests.slice(0, 5);

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validate passwords
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    setIsChangingPassword(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock success (in real app, this would call an API)
    setIsChangingPassword(false);
    setPasswordSuccess("Password changed successfully!");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    // Clear success message after 3 seconds
    setTimeout(() => setPasswordSuccess(""), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />

      <div className="container px-4 md:px-6 pt-4">
        <BreadcrumbNav />
      </div>

      <main id="main-content" className="container px-4 md:px-6 py-8" tabIndex={-1}>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Your Profile</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Account Overview</h1>
          <p className="text-muted-foreground">
            Manage your profile and view your borrowing activity.
          </p>
        </div>

        {/* Profile Header Card */}
        {isLoading ? (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <SkeletonAvatar size="lg" className="h-24 w-24" />
                <div className="flex-1 space-y-3">
                  <div className="h-7 w-48 rounded bg-muted animate-shimmer" />
                  <div className="h-4 w-64 rounded bg-muted animate-shimmer" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 rounded-full bg-muted animate-shimmer" />
                    <div className="h-6 w-20 rounded-full bg-muted animate-shimmer" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row items-start gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1">
                  <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">{user?.name || "User"}</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user?.email || "user@example.com"}
                      </span>
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {user?.department || "Engineering"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {categoriesBorrowed.slice(0, 4).map((category) => (
                        <Badge key={category} variant="secondary" className="capitalize">
                          {category}
                        </Badge>
                      ))}
                      {categoriesBorrowed.length > 4 && (
                        <Badge variant="outline">+{categoriesBorrowed.length - 4} more</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <SkeletonKPICard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Active Loans"
              value={stats.activeLoans}
              subtitle="Currently borrowed"
              icon={Package}
              accentColor="success"
              href="/loans"
            />
            <StatsCard
              title="Pending Requests"
              value={stats.pendingRequests}
              subtitle="Awaiting approval"
              icon={Clock}
              accentColor="warning"
              href="/dashboard"
            />
            <StatsCard
              title="Completed Loans"
              value={stats.completedLoans}
              subtitle="Successfully returned"
              icon={CheckCircle2}
              accentColor="primary"
            />
            <StatsCard
              title="Approval Rate"
              value={`${approvalRate}%`}
              subtitle={`${stats.approvedRequests} approved, ${stats.rejectedRequests} rejected`}
              icon={TrendingUp}
              accentColor={approvalRate >= 80 ? "success" : approvalRate >= 50 ? "warning" : "destructive"}
            />
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Borrowing Insights
                  </CardTitle>
                  <CardDescription>Your borrowing patterns and statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Total Requests</p>
                      <p className="text-2xl font-bold">{stats.totalRequests}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Avg. Loan Duration</p>
                      <p className="text-2xl font-bold">{avgLoanDuration} days</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Categories Used</p>
                      <p className="text-2xl font-bold">{categoriesBorrowed.length}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3">Request Status Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                          Approved/Active
                        </span>
                        <span className="text-sm font-medium">{stats.approvedRequests}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-yellow-500" />
                          Pending
                        </span>
                        <span className="text-sm font-medium">{stats.pendingRequests}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-500" />
                          Rejected
                        </span>
                        <span className="text-sm font-medium">{stats.rejectedRequests}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/catalog">
                      <span className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Browse Device Catalog
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/loans">
                      <span className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Manage My Loans
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/dashboard">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        View My Requests
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Separator className="my-4" />

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-1">Need help?</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Contact IT support for device-related questions.
                    </p>
                    <Button variant="secondary" size="sm">
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest device requests and loans</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((request) => {
                      const device = getDeviceById(request.deviceId);
                      if (!device) return null;

                      const statusConfig = {
                        pending: {
                          icon: Clock,
                          color: "text-yellow-500",
                          bg: "bg-yellow-500/10",
                          label: "Pending",
                        },
                        approved: {
                          icon: CheckCircle2,
                          color: "text-blue-500",
                          bg: "bg-blue-500/10",
                          label: "Approved",
                        },
                        active: {
                          icon: Package,
                          color: "text-green-500",
                          bg: "bg-green-500/10",
                          label: "Active",
                        },
                        returned: {
                          icon: CheckCircle2,
                          color: "text-muted-foreground",
                          bg: "bg-muted",
                          label: "Returned",
                        },
                        rejected: {
                          icon: XCircle,
                          color: "text-destructive",
                          bg: "bg-destructive/10",
                          label: "Rejected",
                        },
                      };

                      const config = statusConfig[request.status];
                      const Icon = config.icon;

                      return (
                        <div
                          key={request.id}
                          className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${config.bg}`}>
                            <Icon className={`h-6 w-6 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">{device.name}</p>
                              <Badge variant="outline" className="capitalize shrink-0">
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(request.startDate), "MMM d")} -{" "}
                              {format(new Date(request.endDate), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-sm text-muted-foreground">Requested</p>
                            <p className="text-sm font-medium">
                              {format(new Date(request.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-4 text-center">
                      <Button asChild variant="outline">
                        <Link to="/dashboard">
                          View All Requests
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    type="no-requests"
                    title="No activity yet"
                    description="Your borrowing activity will appear here."
                    actionLabel="Browse Catalog"
                    actionHref="/catalog"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings Tab */}
          <TabsContent value="settings">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Account Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Personal Info */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Personal Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium truncate">{user?.email || "user@example.com"}</p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">Verified</Badge>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Department</p>
                            <p className="text-sm font-medium">{user?.department || "Engineering"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-cyan-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Employee ID</p>
                            <p className="text-sm font-medium">EMP-{userId.padStart(5, "0")}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Account Status</p>
                            <p className="text-sm font-medium">Active</p>
                          </div>
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              currentPassword: e.target.value,
                            })
                          }
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value,
                            })
                          }
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
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
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {passwordError && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </form>

                  <Separator className="my-6" />

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-1">Password Tips</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Use at least 6 characters</li>
                      <li>• Mix letters, numbers, and symbols</li>
                      <li>• Avoid using personal information</li>
                      <li>• Don't reuse passwords from other sites</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserProfile;
