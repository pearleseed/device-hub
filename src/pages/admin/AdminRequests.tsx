import React, { useState } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { bookingRequests as initialRequests, BookingRequest, RequestStatus, getDeviceById, getUserById } from '@/lib/mockData';
import { Check, X, RotateCcw, List, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const columns: { status: RequestStatus; label: string; color: string }[] = [
  { status: 'pending', label: 'Pending', color: 'border-yellow-500' },
  { status: 'approved', label: 'Approved', color: 'border-blue-500' },
  { status: 'active', label: 'Active', color: 'border-status-available' },
  { status: 'returned', label: 'Returned', color: 'border-muted-foreground' },
];

const AdminRequests: React.FC = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<BookingRequest[]>(initialRequests);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const updateStatus = (id: string, newStatus: RequestStatus) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    toast({ title: 'Status updated', description: `Request moved to ${newStatus}.` });
  };

  const getRequestsByStatus = (status: RequestStatus) => requests.filter(r => r.status === status);

  const RequestCard: React.FC<{ request: BookingRequest }> = ({ request }) => {
    const device = getDeviceById(request.deviceId);
    const user = getUserById(request.userId);
    if (!device || !user) return null;

    return (
      <Card className="mb-3 shadow-soft hover:shadow-medium transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img src={device.image} alt={device.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{device.name}</p>
              <p className="text-sm text-muted-foreground">{device.assetTag}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{user.name}</span>
          </div>

          <div className="text-xs text-muted-foreground mb-3">
            <p>{format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}</p>
            <p className="mt-1 line-clamp-2">{request.reason}</p>
          </div>

          {request.status === 'pending' && (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-status-available hover:bg-status-available/90" onClick={() => updateStatus(request.id, 'approved')}>
                <Check className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => updateStatus(request.id, 'rejected')}>
                <X className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          )}
          {request.status === 'approved' && (
            <Button size="sm" className="w-full" onClick={() => updateStatus(request.id, 'active')}>
              Mark as Active
            </Button>
          )}
          {request.status === 'active' && (
            <Button size="sm" variant="outline" className="w-full" onClick={() => updateStatus(request.id, 'returned')}>
              <RotateCcw className="h-4 w-4 mr-1" /> Mark Returned
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Request Management</h1>
            <p className="text-muted-foreground">Review and manage device requests</p>
          </div>
          <div className="flex gap-2">
            <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('kanban')}>
              <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4 mr-1" /> List
            </Button>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map(col => (
              <div key={col.status} className="space-y-3">
                <div className={cn("flex items-center gap-2 pb-2 border-b-2", col.color)}>
                  <h3 className="font-semibold">{col.label}</h3>
                  <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                    {getRequestsByStatus(col.status).length}
                  </span>
                </div>
                <div className="min-h-[200px]">
                  {getRequestsByStatus(col.status).map(request => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                  {getRequestsByStatus(col.status).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No requests</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader><CardTitle>All Requests</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests.map(request => {
                  const device = getDeviceById(request.deviceId);
                  const user = getUserById(request.userId);
                  if (!device || !user) return null;
                  return (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <img src={device.image} alt={device.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-muted-foreground">{user.name} • {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={request.status} />
                        {request.status === 'pending' && (
                          <>
                            <Button size="sm" variant="ghost" className="text-status-available" onClick={() => updateStatus(request.id, 'approved')}><Check className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus(request.id, 'rejected')}><X className="h-4 w-4" /></Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminRequests;
