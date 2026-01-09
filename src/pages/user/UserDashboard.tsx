import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserNavbar } from "@/components/layout/UserNavbar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BookingRequest } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package,
  Clock,
  ArrowRight,
  Monitor,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { StatsCard } from "@/components/ui/stats-card";
import { RecentlyViewedSection } from "@/components/user/RecentlyViewedSection";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { SkeletonKPICard } from "@/components/ui/skeleton-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUserRequests, useDevices } from "@/hooks/use-data-cache";

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  // Get user's requests using cached data
  const userId = user?.id || "2";
  const { data: userRequests = [], isLoading: requestsLoading } = useUserRequests(userId);
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  
  const isLoading = requestsLoading || devicesLoading;

  // Create a device lookup map for efficient access
  const deviceMap = useMemo(() => {
    return new Map(devices.map(d => [d.id, d]));
  }, [devices]);

  const getDeviceInfo = (request: BookingRequest) => {
    return deviceMap.get(request.deviceId) as typeof devices[0] | undefined;
  };

  const activeLoans = useMemo(() => 
    userRequests.filter((r) => r.status === "active"), [userRequests]);
  const pendingRequests = useMemo(() => 
    userRequests.filter((r) => r.status === "pending"), [userRequests]);

  // Find loans due soon (within 3 days)
  const loansDueSoon = useMemo(() => activeLoans.filter((loan) => {
    const daysRemaining = differenceInDays(new Date(loan.endDate), new Date());
    return daysRemaining >= 0 && daysRemaining <= 3;
  }), [activeLoans]);

  // Find overdue loans
  const overdueLoans = useMemo(() => activeLoans.filter((loan) => {
    const daysRemaining = differenceInDays(new Date(loan.endDate), new Date());
    return daysRemaining < 0;
  }), [activeLoans]);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleDeviceClick = (device: { id: string }) => {
    navigate(`/device/${device.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />

      <div className="container px-4 md:px-6 pt-4">
        <BreadcrumbNav />
      </div>

      <main
        id="main-content"
        className="container px-4 md:px-6 py-8"
        tabIndex={-1}
      >
        {/* Enhanced Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {getGreeting()}, {user?.name?.split(" ")[0] || "User"} 👋
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your device loans and requests.
          </p>
        </div>

        {/* Interactive KPI Cards - Navigate to correct pages */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <SkeletonKPICard />
            <SkeletonKPICard />
            <SkeletonKPICard />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <StatsCard
              title="Active Loans"
              value={activeLoans.length}
              subtitle="Devices currently borrowed"
              icon={Package}
              href="/loans"
              accentColor="success"
            />

            <StatsCard
              title="Pending Requests"
              value={pendingRequests.length}
              subtitle="Awaiting approval"
              icon={Clock}
              href="/loans?tab=pending"
              accentColor="warning"
            />

            <StatsCard
              title="Renewal"
              value={loansDueSoon.length + overdueLoans.length}
              subtitle="Loans eligible for renewal"
              icon={RefreshCw}
              href="/loans?tab=renewals"
              accentColor={overdueLoans.length > 0 ? "destructive" : loansDueSoon.length > 0 ? "warning" : "primary"}
            />
          </div>
        )}

        {/* Alerts Section - Show urgent items */}
        {!isLoading && (overdueLoans.length > 0 || loansDueSoon.length > 0) && (
          <Card className="mb-8 border-orange-500/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Attention Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueLoans.map((loan) => {
                const device = getDeviceInfo(loan);
                if (!device) return null;
                const daysOverdue = Math.abs(
                  differenceInDays(new Date(loan.endDate), new Date())
                );
                return (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={device.image}
                          alt={device.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{device.name}</p>
                        <p className="text-xs text-destructive">
                          {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="destructive" asChild>
                      <Link to="/loans">Return Now</Link>
                    </Button>
                  </div>
                );
              })}
              {loansDueSoon.map((loan) => {
                const device = getDeviceInfo(loan);
                if (!device) return null;
                const daysRemaining = differenceInDays(
                  new Date(loan.endDate),
                  new Date()
                );
                return (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={device.image}
                          alt={device.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{device.name}</p>
                        <p className="text-xs text-orange-600">
                          {daysRemaining === 0
                            ? "Due today"
                            : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-500 text-orange-600 hover:bg-orange-500/10"
                      asChild
                    >
                      <Link to="/loans">View</Link>
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Recently Viewed Section */}
        {recentlyViewed.length > 0 && (
          <RecentlyViewedSection
            deviceIds={recentlyViewed}
            onClear={clearRecentlyViewed}
            onDeviceClick={handleDeviceClick}
            className="mb-8"
          />
        )}

        {/* Activity Summary - Compact overview */}
        {!isLoading && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pending Requests Summary */}
            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Pending Requests
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/loans" className="text-xs">
                        View All
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingRequests.slice(0, 3).map((request) => {
                    const device = getDeviceInfo(request);
                    if (!device) return null;
                    return (
                      <div
                        key={request.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded overflow-hidden bg-muted shrink-0">
                          <img
                            src={device.image}
                            alt={device.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {device.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(request.startDate), "MMM d")} -{" "}
                            {format(new Date(request.endDate), "MMM d")}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-yellow-600 border-yellow-600 shrink-0"
                        >
                          Pending
                        </Badge>
                      </div>
                    );
                  })}
                  {pendingRequests.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{pendingRequests.length - 3} more pending
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Active Loans Summary */}
            {activeLoans.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Active Loans
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/loans" className="text-xs">
                        Manage
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {activeLoans.slice(0, 3).map((loan) => {
                    const device = getDeviceInfo(loan);
                    if (!device) return null;
                    const daysRemaining = differenceInDays(
                      new Date(loan.endDate),
                      new Date()
                    );
                    return (
                      <div
                        key={loan.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded overflow-hidden bg-muted shrink-0">
                          <img
                            src={device.image}
                            alt={device.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {device.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due: {format(new Date(loan.endDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "shrink-0",
                            daysRemaining < 0
                              ? "bg-destructive"
                              : daysRemaining <= 3
                                ? "bg-orange-500"
                                : "bg-green-500"
                          )}
                        >
                          {daysRemaining < 0
                            ? `${Math.abs(daysRemaining)}d overdue`
                            : `${daysRemaining}d left`}
                        </Badge>
                      </div>
                    );
                  })}
                  {activeLoans.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{activeLoans.length - 3} more active
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Empty State - No activity */}
            {activeLoans.length === 0 && pendingRequests.length === 0 && (
              <Card className="md:col-span-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Monitor className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Loans</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    You don't have any active loans or pending requests.
                    <br />
                    Browse our catalog to find devices you need.
                  </p>
                  <Button asChild>
                    <Link to="/catalog">
                      <Monitor className="mr-2 h-4 w-4" />
                      Browse Catalog
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
