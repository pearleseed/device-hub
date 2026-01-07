import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OverdueAlertsBanner } from '@/components/alerts/OverdueAlertsBanner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { devices, bookingRequests, users, getDevicesByStatus, getRequestsByStatus } from '@/lib/mockData';
import { useOverdueAlerts } from '@/hooks/use-overdue-alerts';
import { cn } from '@/lib/utils';
import { Package, AlertTriangle, Users, TrendingUp, Clock, CalendarIcon, RefreshCw, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  href?: string;
  variant?: 'default' | 'warning' | 'danger';
  subtitle?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, href, variant = 'default', subtitle }) => {
  const content = (
    <Card className={cn(
      "transition-all duration-200",
      href && "cursor-pointer hover:shadow-medium hover:-translate-y-0.5",
      variant === 'danger' && "border-red-500 bg-red-500/5",
      variant === 'warning' && "border-yellow-500 bg-yellow-500/5"
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center",
          variant === 'default' && "bg-muted",
          variant === 'danger' && "bg-red-500/10",
          variant === 'warning' && "bg-yellow-500/10"
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-3xl font-bold",
          variant === 'danger' && "text-red-500",
          variant === 'warning' && "text-yellow-600"
        )}>
          {value}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {href && (
          <div className="flex items-center gap-1 text-xs text-primary mt-2">
            <span>View details</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }
  return content;
};

const AdminDashboard: React.FC = () => {
  const { totalOverdue } = useOverdueAlerts();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Date range for chart
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 180),
    to: new Date(),
  });
  
  const availableDevices = getDevicesByStatus('available').length;
  const borrowedDevices = getDevicesByStatus('borrowed').length;
  const maintenanceDevices = getDevicesByStatus('maintenance').length;
  const pendingRequests = getRequestsByStatus('pending').length;

  const pieData = [
    { name: 'Available', value: availableDevices, color: 'hsl(var(--chart-2))' },
    { name: 'Borrowed', value: borrowedDevices, color: 'hsl(var(--chart-1))' },
    { name: 'Maintenance', value: maintenanceDevices, color: 'hsl(var(--chart-4))' },
  ];

  // Generate trend data based on date range
  const trendData = [
    { month: 'Jan', requests: 12, returns: 10 },
    { month: 'Feb', requests: 19, returns: 15 },
    { month: 'Mar', requests: 15, returns: 18 },
    { month: 'Apr', requests: 22, returns: 20 },
    { month: 'May', requests: 18, returns: 16 },
    { month: 'Jun', requests: 25, returns: 22 },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main id="main-content" className="flex-1 p-8" tabIndex={-1} role="main" aria-label="Dashboard content">
        <BreadcrumbNav />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your device management system</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Last updated: {format(lastUpdated, 'h:mm a')}
            </span>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overdue Alerts Banner */}
        <OverdueAlertsBanner className="mb-6" />

        {/* KPI Cards - Now Clickable */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <KPICard
            title="Total Devices"
            value={devices.length}
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
            href="/admin/inventory"
            subtitle={`${availableDevices} available`}
          />
          <KPICard
            title="Devices Out"
            value={borrowedDevices}
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            href="/admin/calendar"
            subtitle="Currently borrowed"
          />
          <KPICard
            title="Pending Requests"
            value={pendingRequests}
            icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
            href="/admin/requests"
            variant={pendingRequests > 0 ? 'warning' : 'default'}
            subtitle="Awaiting approval"
          />
          <KPICard
            title="Total Users"
            value={users.length}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            href="/admin/users"
            subtitle="Active accounts"
          />
          <KPICard
            title="Overdue"
            value={totalOverdue}
            icon={<Clock className={cn("h-4 w-4", totalOverdue > 0 ? "text-red-500" : "text-muted-foreground")} />}
            href="/admin/requests"
            variant={totalOverdue > 0 ? 'danger' : 'default'}
            subtitle={totalOverdue > 0 ? "Need attention" : "All on time"}
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
                          {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
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
                      onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
                    >
                      Last 7 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
                    >
                      Last 30 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}
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
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Requests"
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="returns" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Returns"
                    dot={{ fill: 'hsl(var(--chart-2))' }}
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
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
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
