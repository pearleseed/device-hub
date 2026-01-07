import React, { useState, useCallback } from 'react';
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
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Button } from '@/components/ui/button';
import { bookingRequests as initialRequests, BookingRequest, RequestStatus, getDeviceById, getUserById } from '@/lib/mockData';
import { exportToCSV, requestExportColumns } from '@/lib/exportUtils';
import { List, LayoutGrid, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

  const updateStatus = useCallback((id: string, newStatus: RequestStatus) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    toast({ title: 'Status updated', description: `Request moved to ${newStatus}.` });
  }, [toast]);

  const handleExportCSV = useCallback(() => {
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
  }, [requests, toast]);

  const getRequestsByStatus = (status: RequestStatus) => 
    requests.filter(r => r.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const request = requests.find(r => r.id === active.id);
    if (request) {
      setActiveRequest(request);
    }
  };

  // Helper to find target column status from over id
  const findTargetStatus = (overId: string): RequestStatus | null => {
    // Check if overId is a column status
    const overColumn = columns.find(col => col.status === overId);
    if (overColumn) return overColumn.status;

    // Check if overId is a request id - get its status
    const overRequest = requests.find(r => r.id === overId);
    if (overRequest) return overRequest.status;

    return null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const draggedRequest = requests.find(r => r.id === activeId);
    if (!draggedRequest) return;

    const targetStatus = findTargetStatus(overId);
    if (targetStatus && draggedRequest.status !== targetStatus) {
      // Update status immediately for visual feedback
      setRequests(prev => prev.map(r => 
        r.id === activeId ? { ...r, status: targetStatus } : r
      ));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedId = active.id as string;
    const originalStatus = activeRequest?.status;
    
    setActiveRequest(null);

    if (!over) {
      // Dropped outside - revert to original status
      if (originalStatus) {
        setRequests(prev => prev.map(r => 
          r.id === draggedId ? { ...r, status: originalStatus } : r
        ));
      }
      return;
    }

    const overId = over.id as string;
    const targetStatus = findTargetStatus(overId);
    
    if (targetStatus && originalStatus && targetStatus !== originalStatus) {
      // Show toast for successful move
      toast({ 
        title: 'Status updated', 
        description: `Request moved to ${targetStatus}.` 
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main id="main-content" className="flex-1 p-8" tabIndex={-1} role="main" aria-label="Request management">
        <BreadcrumbNav />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Request Management</h1>
            <p className="text-muted-foreground">Drag cards between columns or use keyboard shortcuts</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {columns.map(col => (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  color={col.color}
                  count={getRequestsByStatus(col.status).length}
                  isDragging={!!activeRequest}
                >
                  <SortableContext
                    items={getRequestsByStatus(col.status).map(r => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {getRequestsByStatus(col.status).map((request) => (
                      <DraggableRequestCard
                        key={request.id}
                        request={request}
                        onStatusChange={updateStatus}
                      />
                    ))}
                  </SortableContext>
                </KanbanColumn>
              ))}
            </div>

            <DragOverlay dropAnimation={{
              duration: 200,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
              {activeRequest ? (
                <div className="opacity-95 scale-105 shadow-2xl">
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
