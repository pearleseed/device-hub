import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserNavbar } from "@/components/layout/UserNavbar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BorrowRequestWithDetails } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { cn, getDeviceThumbnailUrl } from "@/lib/utils";
import { useUserBorrowRequests, useDevices } from "@/hooks/use-api-queries";

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  // Get user's requests using API queries
  const userId = user?.id || 2;
  const { data: userRequests = [], isLoading: requestsLoading } =
    useUserBorrowRequests(userId);
  const { data: devices = [], isLoading: devicesLoading } = useDevices();

  const isLoading = requestsLoading || devicesLoading;

  // Create a device lookup map for efficient access
  const deviceMap = useMemo(() => {
    return new Map(devices.map((d) => [d.id, d]));
  }, [devices]);

  const getDeviceInfo = (request: BorrowRequestWithDetails) => {
    return deviceMap.get(request.device_id);
  };

  const activeLoans = useMemo(
    () => userRequests.filter((r) => r.status === "active"),
    [userRequests],
  );
  const pendingRequests = useMemo(
    () => userRequests.filter((r) => r.status === "pending"),
    [userRequests],
  );

  // Find loans due soon (within 3 days)
  const loansDueSoon = useMemo(
    () =>
      activeLoans.filter((loan) => {
        const daysRemaining = differenceInDays(
          new Date(loan.end_date as unknown as string),
          new Date(),
        );
        return daysRemaining >= 0 && daysRemaining <= 3;
      }),
    [activeLoans],
  );

  // Find overdue loans
  const overdueLoans = useMemo(
    () =>
      activeLoans.filter((loan) => {
        const daysRemaining = differenceInDays(
          new Date(loan.end_date as unknown as string),
          new Date(),
        );
        return daysRemaining < 0;
      }),
    [activeLoans],
  );

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("userDashboard.goodMorning");
    if (hour < 17) return t("userDashboard.goodAfternoon");
    return t("userDashboard.goodEvening");
  };

  const handleDeviceClick = (device: { id: number }) => {
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
        role="main"
        aria-label={t("nav.dashboard")}
      >
        {/* Enhanced Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">
              {format(new Date(), t("common.dateFormatLong"))}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {getGreeting()}, {user?.name?.split(" ")[0] || t("users.user")} 👋
          </h1>
          <p className="text-muted-foreground">{t("userDashboard.overview")}</p>
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
              title={t("userDashboard.activeLoans")}
              value={activeLoans.length}
              subtitle={t("userDashboard.devicesCurrentlyBorrowed")}
              icon={Package}
              href="/loans"
              accentColor="success"
            />

            <StatsCard
              title={t("userDashboard.pendingRequests")}
              value={pendingRequests.length}
              subtitle={t("userDashboard.awaitingApproval")}
              icon={Clock}
              href="/loans?tab=pending"
              accentColor="warning"
            />

            <StatsCard
              title={t("userDashboard.renewal")}
              value={loansDueSoon.length + overdueLoans.length}
              subtitle={t("userDashboard.loansEligibleForRenewal")}
              icon={RefreshCw}
              href="/loans?tab=renewals"
              accentColor={
                overdueLoans.length > 0
                  ? "destructive"
                  : loansDueSoon.length > 0
                    ? "warning"
                    : "primary"
              }
            />
          </div>
        )}

        {/* Alerts Section - Show urgent items */}
        {!isLoading && (overdueLoans.length > 0 || loansDueSoon.length > 0) && (
          <Card
            className="mb-8 border-orange-500/50"
            role="alert"
            aria-live="polite"
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle
                  className="h-5 w-5 text-orange-500"
                  aria-hidden="true"
                />
                {t("userDashboard.attentionRequired")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueLoans.map((loan) => {
                const device = getDeviceInfo(loan);
                if (!device) return null;
                const daysOverdue = Math.abs(
                  differenceInDays(
                    new Date(loan.end_date as unknown as string),
                    new Date(),
                  ),
                );
                return (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={getDeviceThumbnailUrl(
                            device.image_thumbnail_url,
                            device.image_url,
                            device.category,
                          )}
                          alt={device.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{device.name}</p>
                        <p className="text-xs text-destructive">
                          {daysOverdue} {t("ui.days")} {t("ui.overdue")}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="destructive" asChild>
                      <Link to="/loans">{t("userDashboard.returnNow")}</Link>
                    </Button>
                  </div>
                );
              })}
              {loansDueSoon.map((loan) => {
                const device = getDeviceInfo(loan);
                if (!device) return null;
                const daysRemaining = differenceInDays(
                  new Date(loan.end_date as unknown as string),
                  new Date(),
                );
                return (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={getDeviceThumbnailUrl(
                            device.image_thumbnail_url,
                            device.image_url,
                            device.category,
                          )}
                          alt={device.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{device.name}</p>
                        <p className="text-xs text-orange-600">
                          {daysRemaining === 0
                            ? t("userDashboard.dueToday")
                            : `${daysRemaining}${t("ui.day")} ${t("ui.left")}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-500 text-orange-600 hover:bg-orange-500/10"
                      asChild
                    >
                      <Link to="/loans">{t("userDashboard.view")}</Link>
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
                      <Clock
                        className="h-4 w-4 text-yellow-500"
                        aria-hidden="true"
                      />
                      {t("userDashboard.pendingRequests")}
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/loans" className="text-xs">
                        {t("adminDashboard.viewAll")}
                        <ArrowRight
                          className="ml-1 h-3 w-3"
                          aria-hidden="true"
                        />
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
                            src={getDeviceThumbnailUrl(
                              device.image_thumbnail_url,
                              device.image_url,
                              device.category,
                            )}
                            alt={device.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {device.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(
                              new Date(request.start_date as unknown as string),
                              t("common.dateFormatShort"),
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(request.end_date as unknown as string),
                              t("common.dateFormatShort"),
                            )}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-yellow-600 border-yellow-600 shrink-0"
                        >
                          {t("requests.pending")}
                        </Badge>
                      </div>
                    );
                  })}
                  {pendingRequests.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{pendingRequests.length - 3} {t("ui.more")}{" "}
                      {t("requestStatus.pending")}
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
                      <CheckCircle2
                        className="h-4 w-4 text-green-500"
                        aria-hidden="true"
                      />
                      {t("userDashboard.activeLoans")}
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/loans" className="text-xs">
                        {t("userDashboard.manage")}
                        <ArrowRight
                          className="ml-1 h-3 w-3"
                          aria-hidden="true"
                        />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {activeLoans.slice(0, 3).map((loan) => {
                    const device = getDeviceInfo(loan);
                    if (!device) return null;
                    const daysRemaining = differenceInDays(
                      new Date(loan.end_date as unknown as string),
                      new Date(),
                    );
                    return (
                      <div
                        key={loan.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded overflow-hidden bg-muted shrink-0">
                          <img
                            src={getDeviceThumbnailUrl(
                              device.image_thumbnail_url,
                              device.image_url,
                              device.category,
                            )}
                            alt={device.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {device.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("common.due")}:{" "}
                            {format(
                              new Date(loan.end_date as unknown as string),
                              t("common.dateFormatMedium"),
                            )}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "shrink-0",
                            daysRemaining < 0
                              ? "bg-destructive"
                              : daysRemaining <= 3
                                ? "bg-orange-500"
                                : "bg-green-500",
                          )}
                        >
                          {daysRemaining < 0
                            ? `${Math.abs(daysRemaining)}${t("ui.day")} ${t("ui.overdue")}`
                            : `${daysRemaining}${t("ui.day")} ${t("ui.left")}`}
                        </Badge>
                      </div>
                    );
                  })}
                  {activeLoans.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{activeLoans.length - 3} {t("ui.more")}{" "}
                      {t("requestStatus.active")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Empty State - No activity */}
            {activeLoans.length === 0 && pendingRequests.length === 0 && (
              <Card className="md:col-span-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Monitor
                    className="h-12 w-12 text-muted-foreground/50 mb-4"
                    aria-hidden="true"
                  />
                  <h3 className="text-lg font-medium mb-2">
                    {t("userDashboard.noActiveLoans")}
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {t("userDashboard.noActiveLoansDesc")}
                  </p>
                  <Button asChild>
                    <Link to="/catalog">
                      <Monitor className="mr-2 h-4 w-4" aria-hidden="true" />
                      {t("userDashboard.browseCatalog")}
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
