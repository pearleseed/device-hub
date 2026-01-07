import React from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { devices, bookingRequests, users, getDevicesByStatus, getRequestsByStatus } from '@/lib/mockData';
import { Package, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard: React.FC = () => {
  const availableDevices = getDevicesByStatus('available').length;
  const borrowedDevices = getDevicesByStatus('borrowed').length;
  const maintenanceDevices = getDevicesByStatus('maintenance').length;
  const pendingRequests = getRequestsByStatus('pending').length;

  const pieData = [
    { name: 'Available', value: availableDevices, color: 'hsl(142, 71%, 45%)' },
    { name: 'Borrowed', value: borrowedDevices, color: 'hsl(25, 95%, 53%)' },
    { name: 'Maintenance', value: maintenanceDevices, color: 'hsl(215, 16%, 47%)' },
  ];

  const trendData = [
    { month: 'Jan', requests: 12 },
    { month: 'Feb', requests: 19 },
    { month: 'Mar', requests: 15 },
    { month: 'Apr', requests: 22 },
    { month: 'May', requests: 18 },
    { month: 'Jun', requests: 25 },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your device management system</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{devices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Devices Out</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{borrowedDevices}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <AlertTriangle className="h-4 w-4 text-status-borrowed" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingRequests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="requests" stroke="hsl(222, 47%, 11%)" strokeWidth={2} />
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
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
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
