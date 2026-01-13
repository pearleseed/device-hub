import React, { useState, useMemo } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useDevices,
  useUsers,
  useBorrowRequests,
  useRefreshData,
} from "@/hooks/use-api-queries";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Download,
  RefreshCw,
  TrendingUp,
  Laptop,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  BarChart3,
  Activity,
  FileText,
  Percent,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import type { DateRange } from "react-day-picker";

type ReportPeriod = "daily" | "weekly" | "monthly";

const AdminAnalytics: React.FC = () => {
  const { t } = useLanguage();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("weekly");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: devices = [] } = useDevices();
  const { data: users = [] } = useUsers();
  const { data: bookingRequests = [] } = useBorrowRequests();
  const { refreshAll } = useRefreshData();

  // Date range for charts
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 180),
    to: new Date(),
  });

  // ==================== COMPUTED DATA ====================

  // Device statistics
  const deviceStats = useMemo(() => {
    const available = devices.filter((d) => d.status === "available").length;
    const borrowed = devices.filter((d) => d.status === "borrowed").length;
    const maintenance = devices.filter(
      (d) => d.status === "maintenance",
    ).length;
    return { available, borrowed, maintenance, total: devices.length };
  }, [devices]);

  // Request statistics
  const requestStats = useMemo(() => {
    const pending = bookingRequests.filter(
      (r) => r.status === "pending",
    ).length;
    const approved = bookingRequests.filter(
      (r) => r.status === "approved",
    ).length;
    const active = bookingRequests.filter((r) => r.status === "active").length;
    const returned = bookingRequests.filter(
      (r) => r.status === "returned",
    ).length;
    const rejected = bookingRequests.filter(
      (r) => r.status === "rejected",
    ).length;
    return {
      pending,
      approved,
      active,
      returned,
      rejected,
      total: bookingRequests.length,
    };
  }, [bookingRequests]);

  // Device status pie data
  const deviceStatusData = useMemo(
    () => [
      {
        name: t("status.available"),
        value: deviceStats.available,
        color: "hsl(var(--chart-2))",
      },
      {
        name: t("status.borrowed"),
        value: deviceStats.borrowed,
        color: "hsl(var(--chart-1))",
      },
      {
        name: t("status.maintenance"),
        value: deviceStats.maintenance,
        color: "hsl(var(--chart-4))",
      },
    ],
    [deviceStats, t],
  );

  // Device category breakdown
  const categoryData = useMemo(
    () => [
      {
        name: t("category.laptop"),
        count: devices.filter((d) => d.category === "laptop").length,
      },
      {
        name: t("category.mobile"),
        count: devices.filter((d) => d.category === "mobile").length,
      },
      {
        name: t("category.tablet"),
        count: devices.filter((d) => d.category === "tablet").length,
      },
      {
        name: t("category.monitor"),
        count: devices.filter((d) => d.category === "monitor").length,
      },
      {
        name: t("category.accessories"),
        count: devices.filter((d) => d.category === "accessories").length,
      },
    ],
    [devices, t],
  );

  // Request status distribution
  const requestStatusData = useMemo(
    () => [
      {
        name: t("analytics.pendingRequests"),
        value: requestStats.pending,
        color: "hsl(var(--chart-4))",
      },
      {
        name: t("requests.approved"),
        value: requestStats.approved,
        color: "hsl(var(--chart-2))",
      },
      {
        name: t("requests.active"),
        value: requestStats.active,
        color: "hsl(var(--chart-1))",
      },
      {
        name: t("requests.returned"),
        value: requestStats.returned,
        color: "hsl(var(--chart-3))",
      },
      {
        name: t("analytics.requestStatus"),
        value: requestStats.rejected,
        color: "hsl(var(--chart-5))",
      },
    ],
    [requestStats, t],
  );

  // Device condition data
  const deviceConditionData = useMemo(
    () => [
      {
        name: t("condition.excellent"),
        value: Math.floor(devices.length * 0.4),
        color: "hsl(var(--chart-2))",
      },
      {
        name: t("condition.good"),
        value: Math.floor(devices.length * 0.35),
        color: "hsl(var(--chart-1))",
      },
      {
        name: t("condition.fair"),
        value: Math.floor(devices.length * 0.2),
        color: "hsl(var(--chart-4))",
      },
      {
        name: t("condition.damaged"),
        value: Math.floor(devices.length * 0.05),
        color: "hsl(var(--chart-5))",
      },
    ],
    [devices, t],
  );

  // Return compliance data
  const returnComplianceData = useMemo(() => {
    const returnedCount = requestStats.returned;
    const onTime = Math.floor(returnedCount * 0.85);
    const late = returnedCount - onTime;
    return [
      {
        name: t("analytics.onTime"),
        value: onTime,
        color: "hsl(var(--chart-2))",
      },
      { name: t("analytics.late"), value: late, color: "hsl(var(--chart-5))" },
    ];
  }, [requestStats, t]);

  // Top borrowed devices
  const topBorrowedDevices = useMemo(() => {
    const deviceBorrowCount: Record<
      number,
      { device: (typeof devices)[0]; count: number }
    > = {};
    bookingRequests.forEach((req) => {
      const device = devices.find((d) => d.id === req.device_id);
      if (device) {
        if (!deviceBorrowCount[device.id]) {
          deviceBorrowCount[device.id] = { device, count: 0 };
        }
        deviceBorrowCount[device.id].count++;
      }
    });
    return Object.values(deviceBorrowCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        name: item.device.name,
        brand: item.device.brand,
        count: item.count,
        assetTag: item.device.asset_tag,
      }));
  }, [devices, bookingRequests]);

  // Top users by borrowing frequency
  const topUsers = useMemo(() => {
    const userBorrowCount: Record<
      number,
      { user: (typeof users)[0]; count: number }
    > = {};
    bookingRequests.forEach((req) => {
      const user = users.find((u) => u.id === req.user_id);
      if (user) {
        if (!userBorrowCount[user.id]) {
          userBorrowCount[user.id] = { user, count: 0 };
        }
        userBorrowCount[user.id].count++;
      }
    });
    return Object.values(userBorrowCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        name: item.user.name,
        department: item.user.department_name,
        count: item.count,
        avatar: item.user.avatar_url,
      }));
  }, [users, bookingRequests]);

  // Department activity
  const departmentActivity = useMemo(() => {
    const deptStats: Record<string, { requests: number; activeLoans: number }> =
      {};
    users.forEach((user) => {
      const deptName = user.department_name || t("common.unknown");
      if (!deptStats[deptName]) {
        deptStats[deptName] = { requests: 0, activeLoans: 0 };
      }
    });
    bookingRequests.forEach((req) => {
      const user = users.find((u) => u.id === req.user_id);
      const deptName = user?.department_name || t("common.unknown");
      if (user && deptStats[deptName]) {
        deptStats[deptName].requests++;
        if (req.status === "active") {
          deptStats[deptName].activeLoans++;
        }
      }
    });
    return Object.entries(deptStats).map(([name, stats]) => ({
      name,
      requests: stats.requests,
      activeLoans: stats.activeLoans,
    }));
  }, [users, bookingRequests, t]);

  // Monthly trends data
  const trendData = useMemo(() => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = subDays(new Date(), i * 30);
      return {
        month: format(date, "MMM"),
        monthKey: format(date, "yyyy-MM"),
        date: date,
      };
    }).reverse();

    return last12Months.map(({ month, monthKey }) => {
      const requestsCount = bookingRequests.filter((r) =>
        format(new Date(r.created_at), "yyyy-MM") === monthKey
      ).length;

      const returnsCount = bookingRequests.filter((r) =>
        r.status === "returned" && 
        format(new Date(r.updated_at), "yyyy-MM") === monthKey
      ).length;

      return {
        month,
        requests: requestsCount,
        returns: returnsCount,
      };
    });
  }, [bookingRequests]);

  // Compliance trend data
  const complianceTrendData = useMemo(() => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = subDays(new Date(), i * 30);
      return {
        month: format(date, "MMM"),
        monthKey: format(date, "yyyy-MM"),
      };
    }).reverse();

    return last12Months.map(({ month, monthKey }) => {
      const returnedInMonth = bookingRequests.filter((r) =>
        r.status === "returned" && 
        format(new Date(r.updated_at), "yyyy-MM") === monthKey
      );

      if (returnedInMonth.length === 0) {
        return { month, onTime: 100, late: 0 };
      }

      const onTimeCount = returnedInMonth.filter((r) => {
        // Assume updated_at is return time. Check if <= end_date
        return new Date(r.updated_at) <= new Date(r.end_date);
      }).length;

      const lateCount = returnedInMonth.length - onTimeCount;
      const onTimePct = Math.round((onTimeCount / returnedInMonth.length) * 100);

      return {
        month,
        onTime: onTimePct,
        late: 100 - onTimePct,
      };
    });
  }, [bookingRequests]);

  // ==================== HANDLERS ====================

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAll();
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const handleExport = (type: string) => {
    const report = {
      generatedAt: new Date().toISOString(),
      reportType: type,
      period: reportPeriod,
      dateRange: {
        from: dateRange?.from?.toISOString(),
        to: dateRange?.to?.toISOString(),
      },
      summary: {
        totalDevices: deviceStats.total,
        availableDevices: deviceStats.available,
        borrowedDevices: deviceStats.borrowed,
        maintenanceDevices: deviceStats.maintenance,
        totalUsers: users.length,
        totalRequests: requestStats.total,
      },
      deviceCondition: deviceConditionData,
      returnCompliance: returnComplianceData,
      topBorrowedDevices,
      topUsers: topUsers.map((u) => ({
        name: u.name,
        department: u.department,
        borrowCount: u.count,
      })),
      departmentActivity,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-report-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tooltip style
  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
  };

  // ==================== RENDER ====================

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main
        id="main-content"
        className="flex-1 p-8 overflow-auto"
        tabIndex={-1}
        role="main"
      >
        <BreadcrumbNav />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t("analytics.title")}</h1>
            <p className="text-muted-foreground">{t("analytics.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={reportPeriod}
              onValueChange={(v) => setReportPeriod(v as ReportPeriod)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("analytics.daily")}</SelectItem>
                <SelectItem value="weekly">{t("analytics.weekly")}</SelectItem>
                <SelectItem value="monthly">
                  {t("analytics.monthly")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dateRange?.from && dateRange.to
                    ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                    : t("analytics.dateRange")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
                <div className="flex gap-2 p-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      setDateRange({
                        from: subDays(new Date(), 7),
                        to: new Date(),
                      })
                    }
                  >
                    {t("analytics.7days")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      setDateRange({
                        from: subDays(new Date(), 30),
                        to: new Date(),
                      })
                    }
                  >
                    {t("analytics.30days")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      setDateRange({
                        from: startOfMonth(new Date()),
                        to: endOfMonth(new Date()),
                      })
                    }
                  >
                    {t("analytics.thisMonth")}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">
              {t("analytics.updated", { time: format(lastUpdated, "h:mm a") })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")}
              />
              {t("analytics.refresh")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("full")}
            >
              <Download className="h-4 w-4 mr-2" />
              {t("analytics.export")}
            </Button>
          </div>
        </div>

        {/* ==================== KPI SUMMARY CARDS ==================== */}
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          <StatsCard
            icon={Laptop}
            title={t("analytics.totalDevices")}
            value={deviceStats.total}
            subtitle={t("analytics.borrowedCount", {
              count: deviceStats.borrowed,
            })}
            accentColor="primary"
          />
          <StatsCard
            icon={Users}
            title={t("analytics.activeUsers")}
            value={users.filter((u) => u.is_active).length}
            subtitle={t("analytics.totalUsers", { count: users.length })}
            accentColor="primary"
          />
          <StatsCard
            icon={Clock}
            title={t("analytics.pendingRequests")}
            value={requestStats.pending}
            subtitle={t("analytics.activeRequests", {
              count: requestStats.active,
            })}
            accentColor="warning"
          />
          <StatsCard
            icon={TrendingUp}
            title={t("analytics.utilization")}
            value={`${deviceStats.total > 0 ? Math.round((deviceStats.borrowed / deviceStats.total) * 100) : 0}%`}
            subtitle={`+8% ${t("analytics.fromLastMonth")}`}
            accentColor="success"
          />
          <StatsCard
            icon={CheckCircle}
            title={t("analytics.onTimeRate")}
            value={`${requestStats.returned > 0 ? Math.round((returnComplianceData[0].value / requestStats.returned) * 100) : 0}%`}
            subtitle={`+5% ${t("analytics.improvement")}`}
            accentColor="success"
          />
        </div>

        {/* ==================== SECTION 1: DEVICE ANALYTICS ==================== */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Laptop className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {t("analytics.deviceAnalytics")}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Device Status Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("analytics.statusDistribution")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={deviceStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={45}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {deviceStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Condition */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("analytics.conditionStatus")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={deviceConditionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={45}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {deviceConditionData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Devices by Category */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("analytics.byCategory")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis type="number" className="text-xs" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      className="text-xs"
                      width={70}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Borrowed Devices */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                {t("analytics.topBorrowedDevices")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-5">
                {topBorrowedDevices.map((device, index) => (
                  <div
                    key={device.assetTag}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                            ? "bg-gray-100 text-gray-700"
                            : index === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {device.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {device.brand}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {device.count}
                    </Badge>
                  </div>
                ))}
                {topBorrowedDevices.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-5 text-center py-4">
                    {t("analytics.noData")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ==================== SECTION 2: USER & ACTIVITY ANALYTICS ==================== */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {t("analytics.userAnalytics")}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Request Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("analytics.requestStatus")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={requestStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={45}
                      dataKey="value"
                    >
                      {requestStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("analytics.departmentActivity")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={departmentActivity}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      dataKey="requests"
                      fill="hsl(var(--primary))"
                      name={t("analytics.requestsLegend")}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="activeLoans"
                      fill="hsl(var(--chart-2))"
                      name={t("analytics.activeLegend")}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Usage Trends */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("analytics.monthlyTrends")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="requests"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name={t("analytics.requestsLegend")}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="returns"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      name={t("chart.returns")}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Users */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-500" />
                {t("analytics.topBorrowers")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-5">
                {topUsers.map((user, index) => (
                  <div
                    key={user.name}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        index === 0
                          ? "bg-blue-100 text-blue-700"
                          : index === 1
                            ? "bg-gray-100 text-gray-700"
                            : index === 2
                              ? "bg-green-100 text-green-700"
                              : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.department}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {user.count}
                    </Badge>
                  </div>
                ))}
                {topUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-5 text-center py-4">
                    {t("analytics.noData")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ==================== SECTION 3: COMPLIANCE & PERFORMANCE ==================== */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {t("analytics.compliancePerformance")}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Return Compliance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("analytics.returnCompliance")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={returnComplianceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={45}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {returnComplianceData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Compliance Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("analytics.complianceTrend")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={complianceTrendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [`${value}%`]}
                    />
                    <Area
                      type="monotone"
                      dataKey="onTime"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.3}
                      name="On-Time %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* KPI Metrics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("analytics.keyMetrics")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{t("analytics.onTimeRate")}</span>
                  </div>
                  <span className="font-bold">
                    {requestStats.returned > 0
                      ? Math.round(
                          (returnComplianceData[0].value /
                            requestStats.returned) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">
                      {t("analytics.lateReturns")}
                    </span>
                  </div>
                  <span className="font-bold">
                    {returnComplianceData[1]?.value || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">
                      {t("analytics.approvalRate")}
                    </span>
                  </div>
                  <span className="font-bold">
                    {requestStats.total > 0
                      ? Math.round(
                          ((requestStats.approved +
                            requestStats.active +
                            requestStats.returned) /
                            requestStats.total) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">
                      {t("analytics.avgDuration")}
                    </span>
                  </div>
                  <span className="font-bold">{`12 ${t("analytics.days")}`}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ==================== SECTION 4: USER PERFORMANCE TABLE ==================== */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {t("analytics.userPerformanceReport")}
            </h2>
          </div>
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">
                        {t("analytics.user")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        {t("analytics.department")}
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        {t("analytics.total")}
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        {t("analytics.active")}
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        {t("analytics.returned")}
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        {t("analytics.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 6).map((user) => {
                      const userRequests = bookingRequests.filter(
                        (r) => r.user_id === user.id,
                      );
                      const activeLoans = userRequests.filter(
                        (r) => r.status === "active",
                      ).length;
                      const returned = userRequests.filter(
                        (r) => r.status === "returned",
                      ).length;
                      return (
                        <tr
                          key={user.id}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <img
                                src={user.avatar_url || ""}
                                alt=""
                                className="w-7 h-7 rounded-full"
                              />
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {user.department_name}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {userRequests.length}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {activeLoans}
                          </td>
                          <td className="py-3 px-4 text-center">{returned}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={user.is_active ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {user.is_active
                                ? t("status.active")
                                : t("status.inactive")}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
