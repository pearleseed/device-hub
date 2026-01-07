import React from 'react';
import { Link } from 'react-router-dom';
import { UserNavbar } from '@/components/layout/UserNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  getRequestsByUser, 
  getDeviceById, 
  bookingRequests,
  devices,
  BookingRequest 
} from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Clock, ArrowRight, Monitor } from 'lucide-react';
import { format } from 'date-fns';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();

  // Get user's requests (using user id 2 for demo if no user logged in)
  const userId = user?.id || '2';
  const userRequests = getRequestsByUser(userId);
  
  const activeLoans = userRequests.filter(r => r.status === 'active');
  const pendingRequests = userRequests.filter(r => r.status === 'pending');

  const getDeviceInfo = (request: BookingRequest) => {
    const device = getDeviceById(request.deviceId);
    return device;
  };

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />

      <main id="main-content" className="container px-4 md:px-6 py-8" tabIndex={-1}>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your device loans and requests.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeLoans.length}</div>
              <p className="text-xs text-muted-foreground">
                Devices currently borrowed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/catalog">
                  <Monitor className="mr-2 h-4 w-4" />
                  Browse Catalog
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Loans */}
        {activeLoans.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Currently Borrowed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {activeLoans.map(loan => {
                  const device = getDeviceInfo(loan);
                  if (!device) return null;
                  
                  return (
                    <div 
                      key={loan.id} 
                      className="flex gap-4 p-4 border rounded-lg bg-card"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img 
                          src={device.image} 
                          alt={device.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{device.name}</h4>
                        <p className="text-sm text-muted-foreground">{device.assetTag}</p>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <p>Return by: {format(new Date(loan.endDate), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <StatusBadge status="active" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request History */}
        <Card>
          <CardHeader>
            <CardTitle>Request History</CardTitle>
          </CardHeader>
          <CardContent>
            {userRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRequests.map(request => {
                    const device = getDeviceInfo(request);
                    if (!device) return null;
                    
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img 
                                src={device.image} 
                                alt={device.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{device.name}</p>
                              <p className="text-sm text-muted-foreground">{device.assetTag}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{format(new Date(request.startDate), 'MMM d')}</p>
                            <p className="text-muted-foreground">to {format(new Date(request.endDate), 'MMM d, yyyy')}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(request.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No requests yet</p>
                <Button asChild variant="link" className="mt-2">
                  <Link to="/catalog">Browse available devices</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserDashboard;
