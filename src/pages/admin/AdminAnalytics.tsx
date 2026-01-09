import React, { useState, useMemo } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useAdminDashboardData, useRefreshData } from "@/hooks/use-data-cache";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
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

const AdminAnalytics: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedChart, setSelectedChart] = useState("all");
  
  // Use cached data
  const { devices, users, requests: bookingRequests, isLoading, isFetching } = useAdminDashboardData();
  const { refreshAll } = useRefreshData();

  // Computed values
  const getDevicesByStatus = (status: string) => devices.filter(d => d.status === status);
  const getDevicesByCategory = (category: string) => devices.filter(d => d.category === category);
  const getRequestsByStatus = (status: string) => bookingRequests.filter(r => r.status === status);

  // Date range for charts
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 180),
    to: new Date(),
  });

  // Device status data
  const availableDevices = getDevicesByStatus("available").length;
  const borrowedDevices = getDevicesByStatus("borrowed").length;
  const maintenanceDevices = getDevicesByStatus("maintenance").length;

  // Request status data
  const pendingRequests = getRequestsByStatus("pending").length;
  const approvedRequests = getRequestsByStatus("approved").length;
  const activeRequests = getRequestsByStatus("active").length;
  const returnedRequests = getRequestsByStatus("returned").length;
  const rejectedRequests = getRequestsByStatus("rejected").length;

  // Device distribution pie data
  const deviceStatusData = [
    {
      name: "Available",
      value: availableDevices,
      color: "hsl(var(--chart-2))",
    },
    { name: "Borrowed", value: borrowedDevices, color: "hsl(var(--chart-1))" },
    {
      name: "Maintenance",
      value: maintenanceDevices,
      color: "hsl(var(--chart-4))",
    },
  ];

  // Device category breakdown
  const categoryData = [
    { name: "Laptops", count: getDevicesByCategory("laptop").length },
    { name: "Mobile", count: getDevicesByCategory("mobile").length },
    { name: "Tablets", count: getDevicesByCategory("tablet").length },
    { name: "Monitors", count: getDevicesByCategory("monitor").length },
    { name: "Accessories", count: getDevicesByCategory("accessories").length },
  ];

  // Request status distribution
  const requestStatusData = [
    { name: "Pending", value: pendingRequests, color: "hsl(var(--chart-4))" },
    { name: "Approved", value: approvedRequests, color: "hsl(var(--chart-2))" },
    { name: "Active", value: activeRequests, color: "hsl(var(--chart-1))" },
    { name: "Returned", value: returnedRequests, color: "hsl(var(--chart-3))" },
    { name: "Rejected", value: rejectedRequests, color: "hsl(var(--chart-5))" },
  ];

  // Department usage data
  const departmentUsage = users.reduce(
    (acc, user) => {
      acc[user.department] = (acc[user.department] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const departmentData = useMemo(() => {
    // Generate stable mock device counts based on department name hash
    const hashCode = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };
    
    return Object.entries(departmentUsage).map(([name, count]) => ({
      name,
      users: count,
      devices: (hashCode(name) % 5) + 1, // Stable mock device usage per dept
    }));
  }, [departmentUsage]);

  // Monthly trends data
  const trendData = [
    { month: "Jan", requests: 12, returns: 10, newDevices: 2 },
    { month: "Feb", requests: 19, returns: 15, newDevices: 3 },
    { month: "Mar", requests: 15, returns: 18, newDevices: 1 },
    { month: "Apr", requests: 22, returns: 20, newDevices: 4 },
    { month: "May", requests: 18, returns: 16, newDevices: 2 },
    { month: "Jun", requests: 25, returns: 22, newDevices: 3 },
  ];

  // Device utilization over time
  const utilizationData = [
    { month: "Jan", utilization: 65 },
    { month: "Feb", utilization: 72 },
    { month: "Mar", utilization: 68 },
    { month: "Apr", utilization: 78 },
    { month: "May", utilization: 75 },
    { month: "Jun", utilization: 82 },
  ];

  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const handleExport = () => {
    // Create a summary report
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange: {
        from: dateRange?.from?.toISOString(),
        to: dateRange?.to?.toISOString(),
      },
      summary: {
        totalDevices: devices.length,
        availableDevices,
        borrowedDevices,
        maintenanceDevices,
        totalUsers: users.length,
        totalRequests: bookingRequests.length,
      },
      devicesByCategory: categoryData,
      requestsByStatus: requestStatusData.map((r) => ({
        status: r.name,
        count: r.value,
      })),
      monthlyTrends: trendData,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate growth percentages (mock data)
  const requestGrowth = 12;
  const utilizationGrowth = 8;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main
        id="main-content"
        className="flex-1 p-8"
        tabIndex={-1}
        role="main"
        aria-label="Analytics content"
      >
        <BreadcrumbNav />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              System analytics and usage statistics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedChart} onValueChange={setSelectedChart}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter charts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Charts</SelectItem>
                <SelectItem value="devices">Device Analytics</SelectItem>
                <SelectItem value="requests">Request Analytics</SelectItem>
                <SelectItem value="usage">Usage Analytics</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d")} -{" "}
                        {format(dateRange.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  defaultMonth={subDays(new Date(), 30)}
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
                    Last 7 days
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
                    Last 30 days
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
                    This month
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">
              Last updated: {format(lastUpdated, "h:mm a")}
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
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Device Utilization
                  </p>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      (borrowedDevices / devices.length) * 100,
                    )}%
                  </p>
                </div>
                <div className="flex items-center text-green-500 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {utilizationGrowth}%
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Monthly Requests
                  </p>
                  <p className="text-2xl font-bold">
                    {trendData[trendData.length - 1].requests}
                  </p>
                </div>
                <div className="flex items-center text-green-500 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {requestGrowth}%
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Loan Duration</p>
                  <p className="text-2xl font-bold">12 days</p>
                </div>
                <div className="flex items-center text-red-500 text-sm">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  3%
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Approval Rate
                  </p>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      ((approvedRequests + activeRequests + returnedRequests) /
                        bookingRequests.length) *
                        100,
                    )}%
                  </p>
                </div>
                <div className="flex items-center text-green-500 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  5%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Usage Trends */}
          {(selectedChart === "all" || selectedChart === "usage") && (
            <Card>
              <CardHeader>
                <CardTitle>Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="requests"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Requests"
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="returns"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      name="Returns"
                      dot={{ fill: "hsl(var(--chart-2))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Device Distribution */}
          {(selectedChart === "all" || selectedChart === "devices") && (
            <Card>
              <CardHeader>
                <CardTitle>Device Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    >
                      {deviceStatusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Device Categories */}
          {(selectedChart === "all" || selectedChart === "devices") && (
            <Card>
              <CardHeader>
                <CardTitle>Devices by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Request Status Distribution */}
          {(selectedChart === "all" || selectedChart === "requests") && (
            <Card>
              <CardHeader>
                <CardTitle>Request Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={requestStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    >
                      {requestStatusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Department Usage */}
          {(selectedChart === "all" || selectedChart === "usage") && (
            <Card>
              <CardHeader>
                <CardTitle>Department Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="users"
                      fill="hsl(var(--primary))"
                      name="Users"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="devices"
                      fill="hsl(var(--chart-2))"
                      name="Device Loans"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Device Utilization Over Time */}
          {(selectedChart === "all" || selectedChart === "usage") && (
            <Card>
              <CardHeader>
                <CardTitle>Device Utilization Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={utilizationData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [`${value}%`, "Utilization"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="utilization"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
