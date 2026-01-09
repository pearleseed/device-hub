import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OverdueAlertsBanner } from "@/components/alerts/OverdueAlertsBanner";
import { useAdminDashboardData, useRefreshData } from "@/hooks/use-data-cache";
import { useOverdueAlerts } from "@/hooks/use-overdue-alerts";
import { cn } from "@/lib/utils";
import {
  Package,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  RefreshCw,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { format } from "date-fns";

const AdminDashboard: React.FC = () => {
  const { totalOverdue } = useOverdueAlerts();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Use cached data
  const { devices, users, requests: bookingRequests, isLoading, isFetching } = useAdminDashboardData();
  const { refreshAll } = useRefreshData();

  const availableDevices = useMemo(() => 
    devices.filter(d => d.status === "available").length, [devices]);
  const borrowedDevices = useMemo(() => 
    devices.filter(d => d.status === "borrowed").length, [devices]);
  const maintenanceDevices = useMemo(() => 
    devices.filter(d => d.status === "maintenance").length, [devices]);
  const pendingRequests = useMemo(() => 
    bookingRequests.filter(r => r.status === "pending").length, [bookingRequests]);
  const activeRequests = useMemo(() => 
    bookingRequests.filter(r => r.status === "active").length, [bookingRequests]);

  // Recent activity (mock data for quick view)
  const recentRequests = useMemo(() => [...bookingRequests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5), [bookingRequests]);

  const handleRefresh = async () => {
    refreshAll();
    setLastUpdated(new Date());
  };

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
              disabled={isFetching}
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overdue Alerts Banner */}
        <OverdueAlertsBanner className="mb-6" />

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <StatsCard
            title="Total Devices"
            value={devices.length}
            icon={Package}
            href="/admin/inventory"
            subtitle={`${availableDevices} available`}
            accentColor="primary"
          />
          <StatsCard
            title="Devices Out"
            value={borrowedDevices}
            icon={TrendingUp}
            href="/admin/calendar"
            subtitle="Currently borrowed"
            accentColor="success"
          />
          <StatsCard
            title="Pending Requests"
            value={pendingRequests}
            icon={AlertTriangle}
            href="/admin/requests"
            accentColor="warning"
            subtitle="Awaiting approval"
          />
          <StatsCard
            title="Total Users"
            value={users.length}
            icon={Users}
            href="/admin/users"
            subtitle="Active accounts"
            accentColor="primary"
          />
          <StatsCard
            title="Overdue"
            value={totalOverdue}
            icon={Clock}
            href="/admin/requests"
            accentColor="destructive"
            subtitle={totalOverdue > 0 ? "Need attention" : "All on time"}
          />
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Quick Summary</CardTitle>
              <Link to="/admin/analytics">
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Device Utilization</span>
                  <span className="text-lg font-bold">
                    {Math.round((borrowedDevices / devices.length) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Available Devices</span>
                  <span className="text-lg font-bold text-green-600">{availableDevices}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">In Maintenance</span>
                  <span className="text-lg font-bold text-yellow-600">{maintenanceDevices}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Active Loans</span>
                  <span className="text-lg font-bold text-blue-600">{activeRequests}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Requests</CardTitle>
              <Link to="/admin/requests">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">Request #{request.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full capitalize",
                        request.status === "pending" && "bg-yellow-100 text-yellow-800",
                        request.status === "approved" && "bg-blue-100 text-blue-800",
                        request.status === "active" && "bg-green-100 text-green-800",
                        request.status === "returned" && "bg-gray-100 text-gray-800",
                        request.status === "rejected" && "bg-red-100 text-red-800"
                      )}
                    >
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
