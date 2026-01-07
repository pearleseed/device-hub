import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { bookingRequests as initialRequests, BookingRequest, RequestStatus, getDeviceById, getUserById } from '@/lib/mockData';
import { exportToCSV, requestExportColumns } from '@/lib/exportUtils';
import { List, LayoutGrid, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { KanbanColumn } from '@/components/admin/KanbanColumn';
import { DraggableRequestCard, RequestCardContent } from '@/components/admin/DraggableRequestCard';
import { RequestListView } from '@/components/admin/RequestListView';

const columns: { status: RequestStatus; label: string; color: string }[] = [
  { status: 'pending', label: 'Pending', color: 'border-yellow-500 bg-yellow-500/10' },
  { status: 'approved', label: 'Approved', color: 'border-blue-500 bg-blue-500/10' },
  { status: 'active', label: 'Active', color: 'border-status-available bg-status-available/10' },
  { status: 'returned', label: 'Returned', color: 'border-muted-foreground bg-muted/50' },
];

const AdminRequests: React.FC = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<BookingRequest[]>(initialRequests);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeRequest, setActiveRequest] = useState<BookingRequest | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const updateStatus = (id: string, newStatus: RequestStatus) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    toast({ title: 'Status updated', description: `Request moved to ${newStatus}.` });
  };

  const handleExportCSV = () => {
    const exportData = requests.map(request => {
      const device = getDeviceById(request.deviceId);
      const user = getUserById(request.userId);
      return {
        ...request,
        deviceName: device?.name || 'Unknown',
        userName: user?.name || 'Unknown',
      };
    });
    exportToCSV(exportData, 'request_history', requestExportColumns);
    toast({ title: 'Export complete', description: 'Request history has been downloaded as CSV.' });
  };

  const getRequestsByStatus = (status: RequestStatus) => 
    requests.filter(r => r.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const request = requests.find(r => r.id === active.id);
    if (request) {
      setActiveRequest(request);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the request being dragged
    const activeRequest = requests.find(r => r.id === activeId);
    if (!activeRequest) return;

    // Check if we're over a column
    const overColumn = columns.find(col => col.status === overId);
    if (overColumn && activeRequest.status !== overColumn.status) {
      setRequests(prev => prev.map(r => 
        r.id === activeId ? { ...r, status: overColumn.status } : r
      ));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveRequest(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find target column
    const overColumn = columns.find(col => col.status === overId);
    const activeRequest = requests.find(r => r.id === activeId);

    if (overColumn && activeRequest && activeRequest.status !== overId) {
      updateStatus(activeId, overColumn.status);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Request Management</h1>
            <p className="text-muted-foreground">Drag cards between columns to update status</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('kanban')}>
              <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4 mr-1" /> List
            </Button>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {columns.map(col => (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  color={col.color}
                  count={getRequestsByStatus(col.status).length}
                >
                  <SortableContext
                    items={getRequestsByStatus(col.status).map(r => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {getRequestsByStatus(col.status).map(request => (
                      <DraggableRequestCard
                        key={request.id}
                        request={request}
                        onStatusChange={updateStatus}
                      />
                    ))}
                  </SortableContext>
                  {getRequestsByStatus(col.status).length === 0 && (
                    <div className="flex items-center justify-center h-24 border-2 border-dashed border-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Drop here</p>
                    </div>
                  )}
                </KanbanColumn>
              ))}
            </div>

            <DragOverlay>
              {activeRequest ? (
                <div className="opacity-90 rotate-3 scale-105">
                  <RequestCardContent request={activeRequest} isDragging />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <RequestListView requests={requests} onStatusChange={updateStatus} />
        )}
      </main>
    </div>
  );
};

export default AdminRequests;
