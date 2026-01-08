import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OverdueAlertsBanner } from "@/components/alerts/OverdueAlertsBanner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { StatsCard } from "@/components/ui/stats-card";
import { equipmentAPI, usersAPI, borrowingAPI } from "@/lib/api";
import type { Equipment, User, BorrowingRequest } from "@/lib/types";
import { useOverdueAlerts } from "@/hooks/use-overdue-alerts";
import { cn } from "@/lib/utils";
import {
  Package,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  CalendarIcon,
  RefreshCw,
  Loader2,
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
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";

const AdminDashboard: React.FC = () => {
  const { totalOverdue } = useOverdueAlerts();
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data state
  const [devices, setDevices] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<BorrowingRequest[]>([]);

  // Date range for chart
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 180),
    to: new Date(),
  });

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [devicesRes, usersRes, requestsRes] = await Promise.all([
        equipmentAPI.getAll(),
        usersAPI.getAll(),
        borrowingAPI.getAll(),
      ]);

      if (devicesRes.success && devicesRes.data) {
        setDevices(devicesRes.data);
      }
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      }
      if (requestsRes.success && requestsRes.data) {
        setRequests(requestsRes.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const availableDevices = devices.filter(
    (d) => d.status === "available",
  ).length;
  const borrowedDevices = devices.filter((d) => d.status === "borrowed").length;
  const maintenanceDevices = devices.filter(
    (d) => d.status === "maintenance",
  ).length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;

  const pieData = [
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

  // Generate trend data based on date range
  const trendData = [
    { month: "Jan", requests: 12, returns: 10 },
    { month: "Feb", requests: 19, returns: 15 },
    { month: "Mar", requests: 15, returns: 18 },
    { month: "Apr", requests: 22, returns: 20 },
    { month: "May", requests: 18, returns: 16 },
    { month: "Jun", requests: 25, returns: 22 },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main
        id="main-content"
        className="flex-1 p-8"
        tabIndex={-1}
        role="main"
        aria-label="Dashboard content"
      >
        <BreadcrumbNav />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your device management system
            </p>
          </div>
          <div className="flex items-center gap-4">
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
          </div>
        </div>

        {/* Overdue Alerts Banner */}
        <OverdueAlertsBanner className="mb-6" />

        {/* KPI Cards - New Design */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <StatsCard
            title="Total Devices"
            value={devices.length}
            subtitle={`${availableDevices} available`}
            icon={Package}
            accentColor="primary"
            onClick={() => navigate("/admin/inventory")}
          />
          <StatsCard
            title="Devices Out"
            value={borrowedDevices}
            subtitle="Currently borrowed"
            icon={TrendingUp}
            accentColor="success"
            onClick={() => navigate("/admin/calendar")}
          />
          <StatsCard
            title="Pending Requests"
            value={pendingRequests}
            subtitle="Awaiting approval"
            icon={AlertTriangle}
            accentColor={pendingRequests > 0 ? "warning" : "default"}
            onClick={() => navigate("/admin/requests")}
          />
          <StatsCard
            title="Total Users"
            value={users.length}
            subtitle="Active accounts"
            icon={Users}
            accentColor="primary"
            onClick={() => navigate("/admin/users")}
          />
          <StatsCard
            title="Overdue"
            value={totalOverdue}
            subtitle={totalOverdue > 0 ? "Need attention" : "All on time"}
            icon={Clock}
            accentColor={totalOverdue > 0 ? "destructive" : "default"}
            onClick={() => navigate("/admin/requests")}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Usage Trends</CardTitle>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
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
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
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
          <Card>
            <CardHeader>
              <CardTitle>Device Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  >
                    {pieData.map((entry, index) => (
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
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
