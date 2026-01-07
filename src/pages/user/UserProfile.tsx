import React from 'react';
import { Link } from 'react-router-dom';
import { UserNavbar } from '@/components/layout/UserNavbar';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestsByUser, getDeviceById } from '@/lib/mockData';
import { 
  User, 
  Mail, 
  Building2, 
  Calendar, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Settings,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '2';
  const userRequests = getRequestsByUser(userId);

  // Calculate stats
  const stats = {
    totalRequests: userRequests.length,
    activeLoans: userRequests.filter(r => r.status === 'active').length,
    pendingRequests: userRequests.filter(r => r.status === 'pending').length,
    completedLoans: userRequests.filter(r => r.status === 'returned').length,
    approvedRequests: userRequests.filter(r => r.status === 'approved' || r.status === 'active' || r.status === 'returned').length,
    rejectedRequests: userRequests.filter(r => r.status === 'rejected').length,
  };

  const approvalRate = stats.totalRequests > 0 
    ? Math.round((stats.approvedRequests / stats.totalRequests) * 100) 
    : 0;

  // Get unique categories borrowed
  const categoriesBorrowed = [...new Set(
    userRequests
      .map(r => getDeviceById(r.deviceId)?.category)
      .filter(Boolean)
  )];

  // Recent activity (last 5 requests)
  const recentActivity = userRequests.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />

      <main id="main-content" className="container px-4 md:px-6 py-8" tabIndex={-1}>
        <BreadcrumbNav />
        {/* Profile Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="text-2xl">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-1">{user?.name || 'User'}</h1>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user?.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {user?.department || 'Engineering'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Member since Jan 2024
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    {categoriesBorrowed.slice(0, 3).map(category => (
                      <Badge key={category} variant="secondary" className="capitalize">
                        {category}
                      </Badge>
                    ))}
                    {categoriesBorrowed.length > 3 && (
                      <Badge variant="outline">+{categoriesBorrowed.length - 3} more</Badge>
                    )}
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLoans}</div>
              <p className="text-xs text-muted-foreground">Currently borrowed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedLoans}</div>
              <p className="text-xs text-muted-foreground">Returned on time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvalRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.approvedRequests} approved, {stats.rejectedRequests} rejected
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest device requests</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map(request => {
                    const device = getDeviceById(request.deviceId);
                    if (!device) return null;

                    const statusConfig = {
                      pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                      approved: { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                      active: { icon: Package, color: 'text-green-500', bg: 'bg-green-500/10' },
                      returned: { icon: CheckCircle2, color: 'text-muted-foreground', bg: 'bg-muted' },
                      rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
                    };

                    const config = statusConfig[request.status];
                    const Icon = config.icon;

                    return (
                      <div key={request.id} className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${config.bg}`}>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{device.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(request.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {request.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activity yet</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link to="/catalog">Browse devices</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
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
                <Link to="/dashboard">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    View My Requests
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to="/settings">
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Notification Settings
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
      </main>
    </div>
  );
};

export default UserProfile;
