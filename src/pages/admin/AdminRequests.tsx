import React, { useState, useCallback, useMemo } from "react";
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
import type {
  RenewalRequestWithDetails,
  RenewalStatus,
  BorrowRequestWithDetails,
  RequestStatus,
  ReturnRequestWithDetails,
  DeviceCondition,
} from "@/types/api";
import {
  useBorrowRequests,
  useRenewals,
  useReturns,
} from "@/hooks/use-api-queries";
import {
  useUpdateBorrowStatus,
  useUpdateRenewalStatus,
  useUpdateReturnCondition,
} from "@/hooks/use-api-mutations";
import { exportToCSV, requestExportColumns, renewalExportColumns, returnExportColumns } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  List,
  LayoutGrid,
  Download,
  CalendarClock,
  Clock,
  RotateCcw,
} from "lucide-react";
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
import { ReturnKanbanColumn } from "@/components/admin/ReturnKanbanColumn";
import {
  DraggableReturnCard,
  ReturnCardContent,
} from "@/components/admin/DraggableReturnCard";
import { ReturnListView } from "@/components/admin/ReturnListView";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

const AdminRequests: React.FC = () => {
  const { t } = useLanguage();

  // Borrow request columns
  const columns: { status: RequestStatus; label: string; color: string }[] =
    useMemo(
      () => [
        {
          status: "pending",
          label: t("requestStatus.pending"),
          color: "border-yellow-500 bg-yellow-500/10",
        },
        {
          status: "approved",
          label: t("requestStatus.approved"),
          color: "border-blue-500 bg-blue-500/10",
        },
        {
          status: "active",
          label: t("requestStatus.active"),
          color: "border-status-available bg-status-available/10",
        },
      ],
      [t],
    );

  const renewalColumns: {
    status: RenewalStatus;
    label: string;
    color: string;
  }[] = useMemo(
    () => [
      {
        status: "pending",
        label: t("requestStatus.pending"),
        color: "border-yellow-500 bg-yellow-500/10",
      },
      {
        status: "approved",
        label: t("requestStatus.approved"),
        color: "border-green-500 bg-green-500/10",
      },
      {
        status: "rejected",
        label: t("requestStatus.rejected"),
        color: "border-red-500 bg-red-500/10",
      },
    ],
    [t],
  );

  const returnColumns: {
    condition: DeviceCondition;
    label: string;
    color: string;
  }[] = useMemo(
    () => [
      {
        condition: "excellent",
        label: t("condition.excellent"),
        color: "border-green-500 bg-green-500/10",
      },
      {
        condition: "good",
        label: t("condition.good"),
        color: "border-blue-500 bg-blue-500/10",
      },
      {
        condition: "fair",
        label: t("condition.fair"),
        color: "border-yellow-500 bg-yellow-500/10",
      },
      {
        condition: "damaged",
        label: t("condition.damaged"),
        color: "border-red-500 bg-red-500/10",
      },
    ],
    [t],
  );

  // Valid state transitions for Borrow Requests
  const validBorrowTransitions: Record<RequestStatus, RequestStatus[]> =
    useMemo(
      () => ({
        pending: ["approved", "rejected"],
        approved: ["active"],
        active: ["returned"],
        returned: [],
        rejected: [],
      }),
      [],
    );

  // Valid state transitions for Renewal Requests
  const validRenewalTransitions: Record<RenewalStatus, RenewalStatus[]> =
    useMemo(
      () => ({
        pending: ["approved", "rejected"],
        approved: [],
        rejected: [],
      }),
      [],
    );

  const isValidBorrowTransition = useCallback(
    (from: RequestStatus, to: RequestStatus): boolean => {
      return validBorrowTransitions[from]?.includes(to) ?? false;
    },
    [validBorrowTransitions],
  );

  const isValidRenewalTransition = useCallback(
    (from: RenewalStatus, to: RenewalStatus): boolean => {
      return validRenewalTransitions[from]?.includes(to) ?? false;
    },
    [validRenewalTransitions],
  );

  const getInvalidTransitionMessage = useCallback(
    (from: RequestStatus, to: RequestStatus): string => {
      if (from === "returned") {
        return t("requests.error.cannotChangeReturned");
      }
      if (from === "rejected") {
        return t("requests.error.cannotChangeRejected");
      }
      if (from === "pending" && to === "active") {
        return t("requests.error.pendingApproval");
      }
      if (from === "pending" && to === "returned") {
        return t("requests.error.pendingToReturned");
      }
      if (from === "approved" && to === "pending") {
        return t("requests.error.approvedToPending");
      }
      if (from === "approved" && to === "returned") {
        return t("requests.error.approvedToReturned");
      }
      if (from === "approved" && to === "rejected") {
        return t("requests.error.approvedToRejected");
      }
      if (
        from === "active" &&
        (to === "pending" || to === "approved" || to === "rejected")
      ) {
        return t("requests.error.activeToNonReturned");
      }
      return t("requests.error.invalidStatusChange", { from, to });
    },
    [t],
  );

  const getRenewalInvalidTransitionMessage = useCallback(
    (from: RenewalStatus, to: RenewalStatus): string => {
      if (from === "approved") {
        return t("requests.error.renewalApprovedNoChange");
      }
      if (from === "rejected") {
        return t("requests.error.renewalRejectedNoChange");
      }
      if (to === "pending") {
        return t("requests.error.renewalToPending");
      }
      return t("requests.error.invalidStatusChange", { from, to });
    },
    [t],
  );
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mutation hooks
  const updateBorrowStatus = useUpdateBorrowStatus();
  const updateRenewalStatus = useUpdateRenewalStatus();
  const updateReturnCondition = useUpdateReturnCondition();

  // Get initial tab from URL or default to "borrow"
  const tabFromUrl = searchParams.get("tab");
  const validTabs = ["borrow", "renewal", "return"];
  const initialTab =
    tabFromUrl && validTabs.includes(tabFromUrl)
      ? (tabFromUrl as "borrow" | "renewal" | "return")
      : "borrow";

  // Use API hooks - data comes directly from API
  const { data: requests = [], isLoading: isLoadingRequests } =
    useBorrowRequests();
  const { data: renewals = [], isLoading: isLoadingRenewals } =
    useRenewals();
  const { data: returns = [], isLoading: isLoadingReturns } = useReturns();

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [activeTab, setActiveTab] = useState<"borrow" | "renewal" | "return">(
    initialTab,
  );
  const [activeRequest, setActiveRequest] =
    useState<BorrowRequestWithDetails | null>(null);
  const [activeRenewal, setActiveRenewal] =
    useState<RenewalRequestWithDetails | null>(null);
  const [activeReturn, setActiveReturn] =
    useState<ReturnRequestWithDetails | null>(null);

  // Track original status before drag started
  const [originalBorrowStatus, setOriginalBorrowStatus] =
    useState<RequestStatus | null>(null);
  const [originalRenewalStatus, setOriginalRenewalStatus] =
    useState<RenewalStatus | null>(null);
  const [originalReturnCondition, setOriginalReturnCondition] =
    useState<DeviceCondition | null>(null);

  // Sync tab changes to URL
  const handleTabChange = (tab: "borrow" | "renewal" | "return") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Memoize requests grouped by status (excluding returned)
  const requestsByStatus = useMemo(() => {
    const grouped: Record<RequestStatus, BorrowRequestWithDetails[]> = {
      pending: [],
      approved: [],
      active: [],
      returned: [],
      rejected: [],
    };
    for (const r of requests) {
      if (r.status !== "returned") {
        grouped[r.status].push(r);
      }
    }
    return grouped;
  }, [requests]);

  // Memoize renewals grouped by status
  const renewalsByStatus = useMemo(() => {
    const grouped: Record<RenewalStatus, RenewalRequestWithDetails[]> = {
      pending: [],
      approved: [],
      rejected: [],
    };
    for (const r of renewals) {
      grouped[r.status].push(r);
    }
    return grouped;
  }, [renewals]);

  // Memoize returns grouped by condition
  const returnsByCondition = useMemo(() => {
    const grouped: Record<DeviceCondition, ReturnRequestWithDetails[]> = {
      excellent: [],
      good: [],
      fair: [],
      damaged: [],
    };
    for (const r of returns) {
      grouped[r.device_condition].push(r);
    }
    return grouped;
  }, [returns]);

  const getRenewalsByStatus = useCallback(
    (status: RenewalStatus) => renewalsByStatus[status],
    [renewalsByStatus],
  );

  const getRequestsByStatus = useCallback(
    (status: RequestStatus) => requestsByStatus[status],
    [requestsByStatus],
  );

  const getReturnsByCondition = useCallback(
    (condition: DeviceCondition) => returnsByCondition[condition],
    [returnsByCondition],
  );

  // Create lookup maps
  const renewalsById = useMemo(() => {
    const map = new Map<number, RenewalRequestWithDetails>();
    for (const r of renewals) {
      map.set(r.id, r);
    }
    return map;
  }, [renewals]);

  const requestsById = useMemo(() => {
    const map = new Map<number, BorrowRequestWithDetails>();
    for (const r of requests) {
      map.set(r.id, r);
    }
    return map;
  }, [requests]);

  const returnsById = useMemo(() => {
    const map = new Map<number, ReturnRequestWithDetails>();
    for (const r of returns) {
      map.set(r.id, r);
    }
    return map;
  }, [returns]);

  const handleRenewalAction = useCallback(
    async (renewalId: number, action: RenewalStatus) => {
      if (action === "pending") return;

      // Call API directly - React Query will handle cache invalidation
      try {
        await updateRenewalStatus.mutateAsync({ id: renewalId, status: action });
        
        toast({
          title:
            action === "approved"
              ? t("requests.renewalApprovedTitle")
              : t("requests.renewalRejectedTitle"),
          description:
            action === "approved"
              ? t("requests.renewalApprovedDesc")
              : t("requests.renewalRejectedDesc"),
          variant: action,
        });
      } catch (error) {
        console.error("Failed to update renewal status:", error);
      }
    },
    [updateRenewalStatus, toast, t],
  );

  const handleReturnConditionChange = useCallback(
    async (returnId: number, condition: DeviceCondition) => {
      try {
        await updateReturnCondition.mutateAsync({ id: returnId, condition });
        toast({
          title: t("requests.conditionUpdatedTitle"),
          description: `${t("requests.conditionChangedTo")} ${condition}.`,
          variant: condition,
        });
      } catch (error) {
        console.error("Failed to update return condition:", error);
      }
    },
    [updateReturnCondition, toast, t],
  );

  // Renewal drag handlers
  const handleRenewalDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const renewal = renewalsById.get(Number(active.id));
    if (renewal) {
      setActiveRenewal(renewal);
      setOriginalRenewalStatus(renewal.status);
    }
  };

  const renewalColumnStatusSet = useMemo(
    () => new Set(renewalColumns.map((col) => col.status)),
    [renewalColumns],
  );

  const findRenewalTargetStatus = useCallback(
    (overId: string): RenewalStatus | null => {
      if (renewalColumnStatusSet.has(overId as RenewalStatus)) {
        return overId as RenewalStatus;
      }
      const overRenewal = renewalsById.get(Number(overId));
      if (overRenewal) return overRenewal.status;
      return null;
    },
    [renewalColumnStatusSet, renewalsById],
  );

  const handleRenewalDragOver = (_event: DragOverEvent) => {
    // Visual feedback is handled by DragOverlay, no state update needed
  };

  const handleRenewalDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedId = Number(active.id);

    setActiveRenewal(null);
    const capturedOriginalStatus = originalRenewalStatus;
    setOriginalRenewalStatus(null);

    if (!over || !capturedOriginalStatus) {
      return;
    }

    const overId = over.id as string;
    const targetStatus = findRenewalTargetStatus(overId);

    if (!targetStatus || targetStatus === capturedOriginalStatus) {
      return;
    }

    if (!isValidRenewalTransition(capturedOriginalStatus, targetStatus)) {
      toast({
        title: t("requests.invalidTransitionTitle"),
        description: getRenewalInvalidTransitionMessage(
          capturedOriginalStatus,
          targetStatus,
        ),
        variant: "destructive",
      });
      return;
    }

    // Call API to update status
    try {
      await updateRenewalStatus.mutateAsync({ id: draggedId, status: targetStatus });
      toast({
        title: t("requests.statusUpdatedTitle"),
        description: `${t("requests.renewalMovedTo")} ${targetStatus}.`,
        variant: targetStatus,
      });
    } catch (error) {
      console.error("Failed to update renewal status:", error);
    }
  };

  // Return drag handlers
  const handleReturnDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const returnRequest = returnsById.get(Number(active.id));
    if (returnRequest) {
      setActiveReturn(returnRequest);
      setOriginalReturnCondition(returnRequest.device_condition);
    }
  };

  const returnColumnConditionSet = useMemo(
    () => new Set(returnColumns.map((col) => col.condition)),
    [returnColumns],
  );

  const findReturnTargetCondition = useCallback(
    (overId: string): DeviceCondition | null => {
      if (returnColumnConditionSet.has(overId as DeviceCondition)) {
        return overId as DeviceCondition;
      }
      const overReturn = returnsById.get(Number(overId));
      if (overReturn) return overReturn.device_condition;
      return null;
    },
    [returnColumnConditionSet, returnsById],
  );

  const handleReturnDragOver = (_event: DragOverEvent) => {
    // Visual feedback is handled by DragOverlay, no state update needed
  };

  const handleReturnDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedId = Number(active.id);

    setActiveReturn(null);
    const capturedOriginalCondition = originalReturnCondition;
    setOriginalReturnCondition(null);

    if (!over || !capturedOriginalCondition) {
      return;
    }

    const overId = over.id as string;
    const targetCondition = findReturnTargetCondition(overId);

    if (targetCondition === capturedOriginalCondition) {
      return;
    }

    if (targetCondition && targetCondition !== capturedOriginalCondition) {
      // Call API to update return condition
      try {
        await updateReturnCondition.mutateAsync({ id: draggedId, condition: targetCondition });
        toast({
          title: t("requests.conditionUpdatedTitle"),
          description: `${t("requests.conditionChangedTo")} ${targetCondition}.`,
          variant: targetCondition,
        });
      } catch (error) {
        console.error("Failed to update return condition:", error);
      }
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
    async (id: number, newStatus: RequestStatus) => {
      try {
        await updateBorrowStatus.mutateAsync({ id, status: newStatus });
        toast({
          title: t("requests.statusUpdatedTitle"),
          description: `${t("requests.movedTo")} ${newStatus}.`,
          variant: newStatus,
        });
      } catch (error) {
        console.error("Failed to update borrow status:", error);
      }
    },
    [updateBorrowStatus, toast, t],
  );

  const handleExportCSV = useCallback(() => {
    if (activeTab === "borrow") {
      const exportData = requests.map((request) => ({
        ...request,
        deviceName: request.device_name || t("common.unknown"),
        userName: request.user_name || t("common.unknown"),
      }));
      exportToCSV(exportData, "borrow_requests", requestExportColumns);
    } else if (activeTab === "renewal") {
      const exportData = renewals.map((renewal) => ({
        ...renewal,
        deviceName: renewal.device_name || t("common.unknown"),
        userName: renewal.user_name || t("common.unknown"),
      }));
      exportToCSV(exportData, "renewal_requests", renewalExportColumns);
    } else if (activeTab === "return") {
      const exportData = returns.map((returnReq) => ({
        ...returnReq,
        deviceName: returnReq.device_name || t("common.unknown"),
        userName: returnReq.user_name || t("common.unknown"),
      }));
      exportToCSV(exportData, "return_requests", returnExportColumns);
    }
    toast({
      title: t("requests.exportComplete"),
      description: t("requests.historyDownloaded"),
    });
  }, [activeTab, requests, renewals, returns, toast, t]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const request = requestsById.get(Number(active.id));
    if (request) {
      setActiveRequest(request);
      setOriginalBorrowStatus(request.status);
    }
  };

  const columnStatusSet = useMemo(
    () => new Set(columns.map((col) => col.status)),
    [columns],
  );

  const findTargetStatus = useCallback(
    (overId: string): RequestStatus | null => {
      if (columnStatusSet.has(overId as RequestStatus)) {
        return overId as RequestStatus;
      }
      const overRequest = requestsById.get(Number(overId));
      if (overRequest) return overRequest.status;
      return null;
    },
    [columnStatusSet, requestsById],
  );

  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback is handled by DragOverlay, no state update needed
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedId = Number(active.id);

    setActiveRequest(null);
    const capturedOriginalStatus = originalBorrowStatus;
    setOriginalBorrowStatus(null);

    if (!over || !capturedOriginalStatus) {
      return;
    }

    const overId = over.id as string;
    const targetStatus = findTargetStatus(overId);

    if (targetStatus === capturedOriginalStatus) {
      return;
    }

    if (targetStatus && targetStatus !== capturedOriginalStatus) {
      if (!isValidBorrowTransition(capturedOriginalStatus, targetStatus)) {
        toast({
          title: t("requests.invalidTransitionTitle"),
          description: getInvalidTransitionMessage(
            capturedOriginalStatus,
            targetStatus,
          ),
          variant: "destructive",
        });
        return;
      }

      // Call API to update status
      try {
        await updateBorrowStatus.mutateAsync({ id: draggedId, status: targetStatus });
        toast({
          title: t("requests.statusUpdatedTitle"),
          description: `${t("requests.movedTo")} ${targetStatus}.`,
          variant: targetStatus,
        });
      } catch (error) {
        console.error("Failed to update borrow status:", error);
      }
    }
  };

  return (
    <TooltipProvider>
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
              <h1 className="text-2xl font-bold">{t("requests.title")}</h1>
              <p className="text-muted-foreground">{t("requests.subtitle")}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-1" /> {t("requests.export")}
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4 mr-1" /> {t("requests.kanban")}
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 mr-1" /> {t("requests.list")}
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              handleTabChange(v as "borrow" | "renewal" | "return")
            }
          >
            <TabsList className="mb-6 w-full grid grid-cols-3">
              <TabsTrigger value="borrow" className="gap-2">
                <Clock className="h-4 w-4" />
                {t("requests.borrowRequests")}
                <Badge variant="destructive" className="ml-1">
                  {requestsByStatus.pending.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="return" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                {t("requests.returnRequests")}
                <Badge variant="destructive" className="ml-1">
                  {returns.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="renewal" className="gap-2">
                <CalendarClock className="h-4 w-4" />
                {t("requests.renewalRequests")}
                {renewalsByStatus.pending.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {renewalsByStatus.pending.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="borrow">
              {isLoadingRequests ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {columns.map((col) => (
                    <div
                      key={col.status}
                      className="flex flex-col p-3 rounded-xl min-h-[300px]"
                    >
                      <div
                        className={`flex items-center gap-2 pb-2 border-b-2 rounded-t-lg px-2 py-1 mb-3 ${col.color}`}
                      >
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-8 ml-auto rounded-full" />
                      </div>
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <Skeleton
                            key={i}
                            className="h-24 w-full rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : viewMode === "kanban" ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          items={getRequestsByStatus(col.status).map(
                            (r) => r.id,
                          )}
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
                        <RequestCardContent
                          request={activeRequest}
                          isDragging
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              ) : (
                <RequestListView
                  requests={requests.filter((r) => r.status !== "returned")}
                  onStatusChange={updateStatus}
                />
              )}
            </TabsContent>

            <TabsContent value="renewal">
              {isLoadingRenewals ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renewalColumns.map((col) => (
                    <div
                      key={col.status}
                      className="flex flex-col p-3 rounded-xl min-h-[300px]"
                    >
                      <div
                        className={`flex items-center gap-2 pb-2 border-b-2 rounded-t-lg px-2 py-1 mb-3 ${col.color}`}
                      >
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-8 ml-auto rounded-full" />
                      </div>
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <Skeleton
                            key={i}
                            className="h-24 w-full rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : viewMode === "kanban" ? (
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
                          items={getRenewalsByStatus(col.status).map(
                            (r) => r.id,
                          )}
                          strategy={verticalListSortingStrategy}
                        >
                          {getRenewalsByStatus(col.status).map((renewal) => {
                            const borrowRequest = requestsById.get(
                              renewal.borrow_request_id,
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
                          borrowRequest={requestsById.get(
                            activeRenewal.borrow_request_id,
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

            <TabsContent value="return">
              {isLoadingReturns ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {returnColumns.map((col) => (
                    <div
                      key={col.condition}
                      className="flex flex-col p-3 rounded-xl min-h-[300px]"
                    >
                      <div
                        className={`flex items-center gap-2 pb-2 border-b-2 rounded-t-lg px-2 py-1 mb-3 ${col.color}`}
                      >
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-8 ml-auto rounded-full" />
                      </div>
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <Skeleton
                            key={i}
                            className="h-24 w-full rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : viewMode === "kanban" ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleReturnDragStart}
                  onDragOver={handleReturnDragOver}
                  onDragEnd={handleReturnDragEnd}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {returnColumns.map((col) => (
                      <ReturnKanbanColumn
                        key={col.condition}
                        condition={col.condition}
                        label={col.label}
                        color={col.color}
                        count={getReturnsByCondition(col.condition).length}
                        isDragging={!!activeReturn}
                      >
                        <SortableContext
                          items={getReturnsByCondition(col.condition).map(
                            (r) => r.id,
                          )}
                          strategy={verticalListSortingStrategy}
                        >
                          {getReturnsByCondition(col.condition).map(
                            (returnRequest) => (
                              <DraggableReturnCard
                                key={returnRequest.id}
                                returnRequest={returnRequest}
                                onConditionChange={handleReturnConditionChange}
                              />
                            ),
                          )}
                        </SortableContext>
                      </ReturnKanbanColumn>
                    ))}
                  </div>

                  <DragOverlay
                    dropAnimation={{
                      duration: 200,
                      easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                    }}
                  >
                    {activeReturn ? (
                      <div className="opacity-95 scale-105 shadow-2xl">
                        <ReturnCardContent
                          returnRequest={activeReturn}
                          isDragging
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              ) : (
                <ReturnListView
                  returns={returns}
                  onConditionChange={handleReturnConditionChange}
                />
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default AdminRequests;
