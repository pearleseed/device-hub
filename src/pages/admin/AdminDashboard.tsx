import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useDevices,
  useUsers,
  useBorrowRequests,
  useRefreshData,
} from "@/hooks/use-api-queries";
import { useUpdateBorrowStatus } from "@/hooks/use-api-mutations";
import { useOverdueAlerts } from "@/hooks/use-overdue-alerts";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  Package,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  User,
  Laptop,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { SkeletonKPICard } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { BorrowRequestWithDetails } from "@/types/api";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { overdueItems, totalOverdue } = useOverdueAlerts();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showSecondaryStats, setShowSecondaryStats] = useState(false);

  // API queries
  const {
    data: devices = [],
    isLoading: devicesLoading,
    isFetching: devicesFetching,
  } = useDevices();
  const {
    data: users = [],
    isLoading: usersLoading,
    isFetching: usersFetching,
  } = useUsers();
  const {
    data: bookingRequests = [],
    isLoading: requestsLoading,
    isFetching: requestsFetching,
  } = useBorrowRequests();
  const { refreshAll } = useRefreshData();
  const updateBorrowStatus = useUpdateBorrowStatus();

  const isLoading = devicesLoading || usersLoading || requestsLoading;
  const isFetching = devicesFetching || usersFetching || requestsFetching;

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("userDashboard.goodMorning");
    if (hour < 17) return t("userDashboard.goodAfternoon");
    return t("userDashboard.goodEvening");
  };

  // Computed stats
  const availableDevices = useMemo(
    () => devices.filter((d) => d.status === "available").length,
    [devices],
  );
  const inuseDevices = useMemo(
    () => devices.filter((d) => d.status === "inuse").length,
    [devices],
  );
  const maintenanceDevices = useMemo(
    () => devices.filter((d) => d.status === "maintenance").length,
    [devices],
  );
  const pendingRequests = useMemo(
    () => bookingRequests.filter((r) => r.status === "pending"),
    [bookingRequests],
  );

  // Action required items (pending + overdue)
  const actionRequiredItems = useMemo(() => {
    const items: Array<{
      type: "pending" | "overdue";
      request: BorrowRequestWithDetails;
      daysOverdue?: number;
      userName?: string;
      deviceName?: string;
    }> = [];

    // Add pending requests
    pendingRequests.slice(0, 3).forEach((req) => {
      items.push({
        type: "pending",
        request: req,
        userName: req.user_name,
        deviceName: req.device_name,
      });
    });

    // Add overdue items
    overdueItems.slice(0, 3).forEach((item) => {
      items.push({
        type: "overdue",
        request: item.booking,
        daysOverdue: item.daysOverdue,
        userName: item.user?.name,
        deviceName: item.device?.name,
      });
    });

    return items.slice(0, 5);
  }, [pendingRequests, overdueItems]);

  // Recent activity (timeline view)
  const recentActivity = useMemo(
    () =>
      [...bookingRequests]
        .sort(
          (a, b) =>
            new Date(b.updated_at as unknown as string).getTime() -
            new Date(a.updated_at as unknown as string).getTime(),
        )
        .slice(0, 5),
    [bookingRequests],
  );

  const handleRefresh = async () => {
    refreshAll();
    setLastUpdated(new Date());
  };

  const handleApprove = (id: number) => {
    updateBorrowStatus.mutate({ id, status: "approved" });
  };

  const handleReject = (id: number) => {
    updateBorrowStatus.mutate({ id, status: "rejected" });
  };

  const handleMarkReturned = (id: number) => {
    updateBorrowStatus.mutate({ id, status: "returned" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main
        id="main-content"
        className="flex-1 min-w-0 p-8 overflow-hidden"
        tabIndex={-1}
        role="main"
        aria-label="Dashboard content"
      >
        <BreadcrumbNav />

        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8 mt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {getGreeting()}, {user?.name?.split(" ")[0] || t("users.admin")}{" "}
              👋
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              {t("adminDashboard.updated")} {format(lastUpdated, "h:mm a")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              aria-label={t("common.refresh")}
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")}
                aria-hidden="true"
              />
              {t("common.refresh")}
            </Button>
          </div>
        </div>

        {/* Primary KPIs - 3 actionable cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonKPICard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <StatsCard
              title={t("dashboard.pendingRequests")}
              value={pendingRequests.length}
              icon={AlertTriangle}
              href="/admin/requests"
              accentColor={pendingRequests.length > 0 ? "warning" : "default"}
              subtitle={
                pendingRequests.length > 0
                  ? t("dashboard.needAttention")
                  : t("dashboard.allClear")
              }
            />
            <StatsCard
              title={t("dashboard.overdue")}
              value={totalOverdue}
              icon={Clock}
              href="/admin/requests?tab=borrow"
              accentColor={totalOverdue > 0 ? "destructive" : "default"}
              subtitle={
                totalOverdue > 0
                  ? t("dashboard.needAttention")
                  : t("dashboard.allOnTime")
              }
            />
            <StatsCard
              title={t("dashboard.devicesOut")}
              value={inuseDevices}
              icon={Package}
              href="/admin/calendar"
              accentColor="success"
              subtitle={t("dashboard.currentlyBorrowed")}
            />
  </div>
        )}

        {/* Secondary Stats - Collapsible inline */}
        <div className="mb-6">
          <button
            onClick={() => setShowSecondaryStats(!showSecondaryStats)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            aria-expanded={showSecondaryStats}
            aria-controls="secondary-stats"
          >
            {showSecondaryStats ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
            {t("adminDashboard.moreStats")}
          </button>

          {!isLoading && (
            <div
              id="secondary-stats"
              className={cn(
                "flex flex-wrap gap-4 text-sm transition-all duration-200",
                showSecondaryStats
                  ? "opacity-100 max-h-20"
                  : "opacity-0 max-h-0 overflow-hidden",
              )}
              aria-hidden={!showSecondaryStats}
            >
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                <Package
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>
                  {t("dashboard.totalDevices")}:{" "}
                  <strong>{devices.length}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                <span
                  className="h-2 w-2 rounded-full bg-green-500"
                  aria-hidden="true"
                />
                <span>
                  {t("common.available")}: <strong>{availableDevices}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                <span
                  className="h-2 w-2 rounded-full bg-yellow-500"
                  aria-hidden="true"
                />
                <span>
                  {t("adminDashboard.inMaintenance")}:{" "}
                  <strong>{maintenanceDevices}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                <User
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>
                  {t("dashboard.totalUsers")}: <strong>{users.length}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Required & Recent Activity */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Action Required */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  {t("adminDashboard.actionRequired")}
                  {actionRequiredItems.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {pendingRequests.length + totalOverdue}
                    </Badge>
                  )}
                </CardTitle>
                <Link to="/admin/requests">
                  <Button variant="ghost" size="sm">
                    {t("adminDashboard.viewAll")}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {actionRequiredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {t("adminDashboard.noActionRequired")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actionRequiredItems.map((item) => (
                      <div
                        key={`${item.type}-${item.request.id}`}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          item.type === "overdue"
                            ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                            : "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900",
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                              item.type === "overdue"
                                ? "bg-red-100 dark:bg-red-900"
                                : "bg-orange-100 dark:bg-orange-900",
                            )}
                          >
                            {item.type === "overdue" ? (
                              <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Laptop className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium truncate">
                                {item.deviceName ||
                                  t("dashboard.deviceWithId", {
                                    id: item.request.device_id,
                                  })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="truncate">
                                {item.userName ||
                                  t("dashboard.userWithId", {
                                    id: item.request.user_id,
                                  })}
                              </span>
                              {item.type === "overdue" && item.daysOverdue && (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {t("loans.daysOverdue", {
                                    count: item.daysOverdue,
                                  })}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {item.type === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                                onClick={() => handleApprove(item.request.id)}
                                disabled={updateBorrowStatus.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() => handleReject(item.request.id)}
                                disabled={updateBorrowStatus.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                handleMarkReturned(item.request.id)
                              }
                              disabled={updateBorrowStatus.isPending}
                            >
                              {t("adminDashboard.markReturned")}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity (Timeline) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>{t("adminDashboard.recentActivity")}</CardTitle>
                <Link to="/admin/requests">
                  <Button variant="ghost" size="sm">
                    {t("adminDashboard.viewAll")}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t("adminDashboard.noRecentActivity")}
                  </p>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

                    <div className="space-y-4">
                      {recentActivity.map((request, index) => (
                        <div key={request.id} className="flex gap-4 relative">
                          {/* Timeline dot */}
                          <div
                            className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-background",
                              request.status === "pending" &&
                                "bg-orange-100 dark:bg-orange-900",
                              request.status === "approved" &&
                                "bg-blue-100 dark:bg-blue-900",
                              request.status === "active" &&
                                "bg-green-100 dark:bg-green-900",
                              request.status === "returned" &&
                                "bg-gray-100 dark:bg-gray-800",
                              request.status === "rejected" &&
                                "bg-red-100 dark:bg-red-900",
                            )}
                          >
                            <Laptop
                              className={cn(
                                "h-4 w-4",
                                request.status === "pending" &&
                                  "text-orange-600 dark:text-orange-400",
                                request.status === "approved" &&
                                  "text-blue-600 dark:text-blue-400",
                                request.status === "active" &&
                                  "text-green-600 dark:text-green-400",
                                request.status === "returned" &&
                                  "text-gray-600 dark:text-gray-400",
                                request.status === "rejected" &&
                                  "text-red-600 dark:text-red-400",
                              )}
                            />
                          </div>

                          <div className="flex-1 min-w-0 pb-4">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium truncate">
                                {request.device_name ||
                                  t("dashboard.deviceWithId", {
                                    id: request.device_id,
                                  })}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] shrink-0",
                                  request.status === "pending" &&
                                    "border-orange-300 text-orange-600",
                                  request.status === "approved" &&
                                    "border-blue-300 text-blue-600",
                                  request.status === "active" &&
                                    "border-green-300 text-green-600",
                                  request.status === "returned" &&
                                    "border-gray-300 text-gray-600",
                                  request.status === "rejected" &&
                                    "border-red-300 text-red-600",
                                )}
                              >
                                {t(`requestStatus.${request.status}`)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="truncate">
                                {request.user_name ||
                                  t("dashboard.userWithId", {
                                    id: request.user_id,
                                  })}
                              </span>
                              <span>•</span>
                              <span>
                                {format(
                                  new Date(
                                    request.updated_at as unknown as string,
                                  ),
                                  "MMM d, h:mm a",
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
