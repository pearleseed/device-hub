import React, { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BookingRequest, RequestStatus, RenewalRequest, RenewalStatus } from "@/lib/mockData";
import {
  renewalRequests as initialRenewals,
  getDeviceById,
  getUserById,
} from "@/lib/mockData";
import { useBookingRequests } from "@/hooks/use-data-cache";
import { exportToCSV, requestExportColumns } from "@/lib/exportUtils";
import { List, LayoutGrid, Download, CalendarClock, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { KanbanColumn } from "@/components/admin/KanbanColumn";
import {
  DraggableRequestCard,
  RequestCardContent,
} from "@/components/admin/DraggableRequestCard";
import { RequestListView } from "@/components/admin/RequestListView";
import { RenewalKanbanColumn } from "@/components/admin/RenewalKanbanColumn";
import {
  DraggableRenewalCard,
  RenewalCardContent,
} from "@/components/admin/DraggableRenewalCard";
import { RenewalListView } from "@/components/admin/RenewalListView";

const columns: { status: RequestStatus; label: string; color: string }[] = [
  {
    status: "pending",
    label: "Pending",
    color: "border-yellow-500 bg-yellow-500/10",
  },
  {
    status: "approved",
    label: "Approved",
    color: "border-blue-500 bg-blue-500/10",
  },
  {
    status: "active",
    label: "Active",
    color: "border-status-available bg-status-available/10",
  },
  {
    status: "returned",
    label: "Returned",
    color: "border-muted-foreground bg-muted/50",
  },
];

const renewalColumns: { status: RenewalStatus; label: string; color: string }[] = [
  {
    status: "pending",
    label: "Pending",
    color: "border-yellow-500 bg-yellow-500/10",
  },
  {
    status: "approved",
    label: "Approved",
    color: "border-green-500 bg-green-500/10",
  },
  {
    status: "rejected",
    label: "Rejected",
    color: "border-red-500 bg-red-500/10",
  },
];

// Valid state transitions for Borrow Requests
// pending -> approved (admin approves)
// pending -> rejected (admin rejects)
// approved -> active (user picks up device)
// active -> returned (user returns device)
const validBorrowTransitions: Record<RequestStatus, RequestStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["active"],
  active: ["returned"],
  returned: [], // Final state - no transitions allowed
  rejected: [], // Final state - no transitions allowed
};

// Valid state transitions for Renewal Requests
// pending -> approved (admin approves extension)
// pending -> rejected (admin rejects extension)
const validRenewalTransitions: Record<RenewalStatus, RenewalStatus[]> = {
  pending: ["approved", "rejected"],
  approved: [], // Final state
  rejected: [], // Final state
};

const isValidBorrowTransition = (from: RequestStatus, to: RequestStatus): boolean => {
  return validBorrowTransitions[from]?.includes(to) ?? false;
};

const isValidRenewalTransition = (from: RenewalStatus, to: RenewalStatus): boolean => {
  return validRenewalTransitions[from]?.includes(to) ?? false;
};

const getInvalidTransitionMessage = (from: RequestStatus, to: RequestStatus): string => {
  if (from === "returned") {
    return "Returned requests cannot be moved to another status.";
  }
  if (from === "rejected") {
    return "Rejected requests cannot be moved to another status.";
  }
  if (from === "pending" && to === "active") {
    return "Pending requests must be approved before becoming active.";
  }
  if (from === "pending" && to === "returned") {
    return "Pending requests cannot be marked as returned directly.";
  }
  if (from === "approved" && to === "pending") {
    return "Approved requests cannot be moved back to pending.";
  }
  if (from === "approved" && to === "returned") {
    return "Approved requests must be active before being returned.";
  }
  if (from === "approved" && to === "rejected") {
    return "Approved requests cannot be rejected.";
  }
  if (from === "active" && (to === "pending" || to === "approved" || to === "rejected")) {
    return "Active requests can only be moved to returned.";
  }
  return `Cannot move from ${from} to ${to}.`;
};

const getRenewalInvalidTransitionMessage = (from: RenewalStatus, to: RenewalStatus): string => {
  if (from === "approved") {
    return "Approved renewals cannot be changed.";
  }
  if (from === "rejected") {
    return "Rejected renewals cannot be changed.";
  }
  if (to === "pending") {
    return "Requests cannot be moved back to pending.";
  }
  return `Cannot move from ${from} to ${to}.`;
};

const AdminRequests: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL or default to "borrow"
  const tabFromUrl = searchParams.get("tab");
  const validTabs = ["borrow", "renewal"];
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl as "borrow" | "renewal" : "borrow";
  
  // Use cached data
  const { data: cachedRequests = [] } = useBookingRequests();
  
  // Local state for optimistic updates
  const [localRequests, setLocalRequests] = useState<BookingRequest[] | null>(null);
  const requests = localRequests ?? cachedRequests;
  const setRequests = useCallback((updater: BookingRequest[] | ((prev: BookingRequest[]) => BookingRequest[])) => {
    setLocalRequests((prev) => {
      const currentRequests = prev ?? cachedRequests;
      if (typeof updater === 'function') {
        return updater(currentRequests);
      } else {
        return updater;
      }
    });
  }, [cachedRequests]);
  
  const [renewals, setRenewals] = useState<RenewalRequest[]>(initialRenewals);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [activeTab, setActiveTab] = useState<"borrow" | "renewal">(initialTab);
  const [activeRequest, setActiveRequest] = useState<BookingRequest | null>(
    null,
  );
  const [activeRenewal, setActiveRenewal] = useState<RenewalRequest | null>(
    null,
  );

  // Sync tab changes to URL
  const handleTabChange = (tab: "borrow" | "renewal") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const getRenewalsByStatus = (status: RenewalStatus) =>
    renewals.filter((r) => r.status === status);

  const handleRenewalAction = useCallback(
    (renewalId: string, action: RenewalStatus) => {
      if (action === "pending") return; // Don't allow moving back to pending
      
      setRenewals((prev) =>
        prev.map((r) =>
          r.id === renewalId
            ? {
                ...r,
                status: action,
                reviewedBy: "1", // Current admin
                reviewedAt: new Date().toISOString(),
              }
            : r,
        ),
      );

      // If approved, update the borrow request end date
      if (action === "approved") {
        const renewal = renewals.find((r) => r.id === renewalId);
        if (renewal) {
          setRequests((prev) =>
            prev.map((r) =>
              r.id === renewal.borrowRequestId
                ? { ...r, endDate: renewal.requestedEndDate }
                : r,
            ),
          );
        }
      }

      toast({
        title: action === "approved" ? "Renewal Approved" : "Renewal Rejected",
        description:
          action === "approved"
            ? "The loan period has been extended."
            : "The renewal request has been rejected.",
      });
    },
    [renewals, setRequests, toast],
  );

  // Renewal drag handlers
  const handleRenewalDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const renewal = renewals.find((r) => r.id === active.id);
    if (renewal) {
      setActiveRenewal(renewal);
    }
  };

  const findRenewalTargetStatus = (overId: string): RenewalStatus | null => {
    const overColumn = renewalColumns.find((col) => col.status === overId);
    if (overColumn) return overColumn.status;

    const overRenewal = renewals.find((r) => r.id === overId);
    if (overRenewal) return overRenewal.status;

    return null;
  };

  const handleRenewalDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const draggedRenewal = renewals.find((r) => r.id === activeId);
    if (!draggedRenewal) return;

    const originalStatus = activeRenewal?.status;
    const targetStatus = findRenewalTargetStatus(overId);
    
    // Only update if it's a valid transition
    if (targetStatus && originalStatus && targetStatus !== draggedRenewal.status) {
      if (isValidRenewalTransition(originalStatus, targetStatus)) {
        setRenewals((prev) =>
          prev.map((r) =>
            r.id === activeId ? { ...r, status: targetStatus } : r,
          ),
        );
      }
    }
  };

  const handleRenewalDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedId = active.id as string;
    const originalStatus = activeRenewal?.status;

    setActiveRenewal(null);

    if (!over) {
      if (originalStatus) {
        setRenewals((prev) =>
          prev.map((r) =>
            r.id === draggedId ? { ...r, status: originalStatus } : r,
          ),
        );
      }
      return;
    }

    const overId = over.id as string;
    const targetStatus = findRenewalTargetStatus(overId);

    if (targetStatus && originalStatus && targetStatus !== originalStatus) {
      // Check if transition is valid
      if (!isValidRenewalTransition(originalStatus, targetStatus)) {
        // Revert to original status
        setRenewals((prev) =>
          prev.map((r) =>
            r.id === draggedId ? { ...r, status: originalStatus } : r,
          ),
        );
        toast({
          title: "Invalid transition",
          description: getRenewalInvalidTransitionMessage(originalStatus, targetStatus),
          variant: "destructive",
        });
        return;
      }

      // Update reviewedBy and reviewedAt for status changes
      setRenewals((prev) =>
        prev.map((r) =>
          r.id === draggedId
            ? {
                ...r,
                status: targetStatus,
                reviewedBy: "1",
                reviewedAt: new Date().toISOString(),
              }
            : r,
        ),
      );

      // If approved, update the borrow request end date
      if (targetStatus === "approved") {
        const renewal = renewals.find((r) => r.id === draggedId);
        if (renewal) {
          setRequests((prev) =>
            prev.map((r) =>
              r.id === renewal.borrowRequestId
                ? { ...r, endDate: renewal.requestedEndDate }
                : r,
            ),
          );
        }
      }

      toast({
        title: "Status updated",
        description: `Renewal request moved to ${targetStatus}.`,
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const updateStatus = useCallback(
    (id: string, newStatus: RequestStatus) => {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      );
      toast({
        title: "Status updated",
        description: `Request moved to ${newStatus}.`,
      });
    },
    [setRequests, toast],
  );

  const handleExportCSV = useCallback(() => {
    const exportData = requests.map((request) => {
      const device = getDeviceById(request.deviceId);
      const user = getUserById(request.userId);
      return {
        ...request,
        deviceName: device?.name || "Unknown",
        userName: user?.name || "Unknown",
      };
    });
    exportToCSV(exportData, "request_history", requestExportColumns);
    toast({
      title: "Export complete",
      description: "Request history has been downloaded as CSV.",
    });
  }, [requests, toast]);

  const getRequestsByStatus = (status: RequestStatus) =>
    requests.filter((r) => r.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const request = requests.find((r) => r.id === active.id);
    if (request) {
      setActiveRequest(request);
    }
  };

  // Helper to find target column status from over id
  const findTargetStatus = (overId: string): RequestStatus | null => {
    // Check if overId is a column status
    const overColumn = columns.find((col) => col.status === overId);
    if (overColumn) return overColumn.status;

    // Check if overId is a request id - get its status
    const overRequest = requests.find((r) => r.id === overId);
    if (overRequest) return overRequest.status;

    return null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const draggedRequest = requests.find((r) => r.id === activeId);
    if (!draggedRequest) return;

    const originalStatus = activeRequest?.status;
    const targetStatus = findTargetStatus(overId);
    
    // Only update if it's a valid transition
    if (targetStatus && originalStatus && targetStatus !== draggedRequest.status) {
      if (isValidBorrowTransition(originalStatus, targetStatus)) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === activeId ? { ...r, status: targetStatus } : r,
          ),
        );
      }
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
        setRequests((prev) =>
          prev.map((r) =>
            r.id === draggedId ? { ...r, status: originalStatus } : r,
          ),
        );
      }
      return;
    }

    const overId = over.id as string;
    const targetStatus = findTargetStatus(overId);

    if (targetStatus && originalStatus && targetStatus !== originalStatus) {
      // Check if transition is valid
      if (!isValidBorrowTransition(originalStatus, targetStatus)) {
        // Revert to original status
        setRequests((prev) =>
          prev.map((r) =>
            r.id === draggedId ? { ...r, status: originalStatus } : r,
          ),
        );
        toast({
          title: "Invalid transition",
          description: getInvalidTransitionMessage(originalStatus, targetStatus),
          variant: "destructive",
        });
        return;
      }

      // Show toast for successful move
      toast({
        title: "Status updated",
        description: `Request moved to ${targetStatus}.`,
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main
        id="main-content"
        className="flex-1 p-8"
        tabIndex={-1}
        role="main"
        aria-label="Request management"
      >
        <BreadcrumbNav />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Request Management</h1>
            <p className="text-muted-foreground">
              Manage borrow requests and renewal requests
            </p>
          </div>
          <div className="flex gap-2">
            {activeTab === "borrow" && (
              <>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
              </>
            )}
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-1" /> List
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as "borrow" | "renewal")}>
          <TabsList className="mb-6 w-full grid grid-cols-2">
            <TabsTrigger value="borrow" className="gap-2">
              <Clock className="h-4 w-4" />
              Borrow Requests
              <Badge variant="secondary" className="ml-1">
                {requests.filter((r) => r.status === "pending").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="renewal" className="gap-2">
              <CalendarClock className="h-4 w-4" />
              Renewal Requests
              {getRenewalsByStatus("pending").length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {getRenewalsByStatus("pending").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="borrow">
            {viewMode === "kanban" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {columns.map((col) => (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  color={col.color}
                  count={getRequestsByStatus(col.status).length}
                  isDragging={!!activeRequest}
                >
                  <SortableContext
                    items={getRequestsByStatus(col.status).map((r) => r.id)}
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

            <DragOverlay
              dropAnimation={{
                duration: 200,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
              }}
            >
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
          </TabsContent>

          <TabsContent value="renewal">
            {viewMode === "kanban" ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleRenewalDragStart}
                onDragOver={handleRenewalDragOver}
                onDragEnd={handleRenewalDragEnd}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renewalColumns.map((col) => (
                    <RenewalKanbanColumn
                      key={col.status}
                      status={col.status}
                      label={col.label}
                      color={col.color}
                      count={getRenewalsByStatus(col.status).length}
                      isDragging={!!activeRenewal}
                    >
                      <SortableContext
                        items={getRenewalsByStatus(col.status).map((r) => r.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {getRenewalsByStatus(col.status).map((renewal) => {
                          const borrowRequest = requests.find(
                            (r) => r.id === renewal.borrowRequestId,
                          );
                          return (
                            <DraggableRenewalCard
                              key={renewal.id}
                              renewal={renewal}
                              borrowRequest={borrowRequest}
                              onStatusChange={handleRenewalAction}
                            />
                          );
                        })}
                      </SortableContext>
                    </RenewalKanbanColumn>
                  ))}
                </div>

                <DragOverlay
                  dropAnimation={{
                    duration: 200,
                    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                  }}
                >
                  {activeRenewal ? (
                    <div className="opacity-95 scale-105 shadow-2xl">
                      <RenewalCardContent
                        renewal={activeRenewal}
                        borrowRequest={requests.find(
                          (r) => r.id === activeRenewal.borrowRequestId,
                        )}
                        isDragging
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <RenewalListView
                renewals={renewals}
                requests={requests}
                onStatusChange={handleRenewalAction}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminRequests;
