import React, { useState, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UserNavbar } from "@/components/layout/UserNavbar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type {
  BorrowRequestWithDetails,
  DeviceWithDepartment,
} from "@/types/api";
import {
  useUserBorrowRequests,
  useDevices,
  useRenewals,
  useRenewalsByBorrow,
} from "@/hooks/use-api-queries";
import {
  useCreateReturnRequest,
  useCreateRenewalRequest,
} from "@/hooks/use-api-mutations";
import {
  Package,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarClock,
  ArrowLeftRight,
  History,
  RefreshCw,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Search,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { format, differenceInDays, addDays, isAfter, isBefore } from "date-fns";
import { toast } from "sonner";
import { StatsCard } from "@/components/ui/stats-card";
import { SkeletonKPICard, SkeletonTable } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type ReturnCondition = "excellent" | "good" | "fair" | "damaged";
type ViewMode = "table" | "timeline";
type StatusFilter = "all" | "active" | "pending" | "returned" | "rejected" | "renewals";

interface ReturnModalData {
  loan: BorrowRequestWithDetails;
  device: DeviceWithDepartment;
}

interface RenewalModalData {
  loan: BorrowRequestWithDetails;
  device: DeviceWithDepartment;
}

interface UnifiedLoanItem {
  id: number;
  type: "loan" | "renewal";
  device: DeviceWithDepartment | undefined;
  status: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  createdAt: Date;
  originalLoan?: BorrowRequestWithDetails;
  renewalData?: {
    currentEndDate: Date;
    requestedEndDate: Date;
  };
}

const LoanManagement: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // View and filter state
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    const status = searchParams.get("status") as StatusFilter;
    if (["active", "pending", "returned", "rejected", "renewals"].includes(status)) {
      return status;
    }
    return "all";
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Sync state with URL when searchParams change (e.g., back navigation)
  React.useEffect(() => {
    const status = searchParams.get("status") as StatusFilter;
    if (status && status !== statusFilter) {
      if (["active", "pending", "returned", "rejected", "renewals"].includes(status)) {
        setStatusFilter(status);
      } else if (status === "all") {
        setStatusFilter("all");
      }
    }
  }, [searchParams, statusFilter]);

  // Sync URL with state when filter changes
  React.useEffect(() => {
    if (statusFilter !== "all") {
      setSearchParams(prev => {
        prev.set("status", statusFilter);
        return prev;
      }, { replace: true });
    } else if (searchParams.has("status")) {
      setSearchParams(prev => {
        prev.delete("status");
        return prev;
      }, { replace: true });
    }
  }, [statusFilter, setSearchParams, searchParams]);

  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnModalData, setReturnModalData] =
    useState<ReturnModalData | null>(null);
  const [returnCondition, setReturnCondition] =
    useState<ReturnCondition>("good");
  const [returnNotes, setReturnNotes] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Renewal modal state
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [renewalModalData, setRenewalModalData] =
    useState<RenewalModalData | null>(null);
  const [renewalDate, setRenewalDate] = useState("");
  const [renewalReason, setRenewalReason] = useState("");
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false);



  // Data fetching
  const { data: userRequests = [], isLoading: requestsLoading } =
    useUserBorrowRequests(user?.id ?? 0);
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const { data: allRenewalRequests = [] } = useRenewals();
  const isLoading = requestsLoading || devicesLoading;

  // Mutation hooks
  const createReturnRequest = useCreateReturnRequest();
  const createRenewalRequest = useCreateRenewalRequest();

  // Create device lookup map
  const deviceMap = useMemo(() => {
    const map = new Map<number, DeviceWithDepartment>();
    devices.forEach((d) => map.set(d.id, d));
    return map;
  }, [devices]);

  const getDeviceById = useCallback(
    (id: number) => deviceMap.get(id),
    [deviceMap],
  );

  // Categorize requests
  const activeLoans = useMemo(
    () => userRequests.filter((r) => r.status === "active"),
    [userRequests],
  );
  const pendingRequests = useMemo(
    () => userRequests.filter((r) => r.status === "pending"),
    [userRequests],
  );
  const completedRequests = useMemo(
    () =>
      userRequests.filter(
        (r) => r.status === "returned" || r.status === "rejected",
      ),
    [userRequests],
  );

  // Get all renewal requests for user's loans
  const allRenewals = useMemo(() => {
    // Filter renewals that belong to user's active loans
    const activeLoanIds = new Set(activeLoans.map((loan) => loan.id));
    return allRenewalRequests
      .filter((renewal) => activeLoanIds.has(renewal.borrow_request_id))
      .map((renewal) => {
        const loan = activeLoans.find(
          (l) => l.id === renewal.borrow_request_id,
        );
        return {
          ...renewal,
          loan,
          device: loan ? deviceMap.get(loan.device_id) : undefined,
        };
      });
  }, [activeLoans, allRenewalRequests, deviceMap]);

  // Create unified list of all items for the table view
  const unifiedItems = useMemo((): UnifiedLoanItem[] => {
    const items: UnifiedLoanItem[] = [];

    // Add all loan requests
    userRequests.forEach((request) => {
      items.push({
        id: request.id,
        type: "loan",
        device: getDeviceById(request.device_id),
        status: request.status,
        startDate: new Date(request.start_date),
        endDate: new Date(request.end_date),
        reason: request.reason,
        createdAt: new Date(request.created_at),
        originalLoan: request,
      });
    });

    // Add renewal requests as separate items
    allRenewals.forEach((renewal) => {
      items.push({
        id: renewal.id,
        type: "renewal",
        device: renewal.device,
        status: `renewal-${renewal.status}`,
        startDate: new Date(renewal.current_end_date),
        endDate: new Date(renewal.requested_end_date),
        reason: renewal.reason,
        createdAt: new Date(renewal.created_at),
        originalLoan: renewal.loan,
        renewalData: {
          currentEndDate: new Date(renewal.current_end_date),
          requestedEndDate: new Date(renewal.requested_end_date),
        },
      });
    });

    // Sort by createdAt descending (most recent first)
    return items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [userRequests, allRenewals, getDeviceById]);

  // Filter items based on status and search
  const filteredItems = useMemo(() => {
    return unifiedItems.filter((item) => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "active" && item.status !== "active") return false;
        if (statusFilter === "pending" && !item.status.includes("pending"))
          return false;
        if (statusFilter === "returned" && item.status !== "returned")
          return false;
        if (statusFilter === "rejected" && !item.status.includes("rejected"))
          return false;
        if (statusFilter === "renewals") {
          // Show actual renewal requests OR active loans due soon/overdue
          const isRenewalRequest = item.type === "renewal";
          const isActiveLoanDueSoonOrOverdue =
            item.type === "loan" &&
            item.status === "active" &&
            differenceInDays(new Date(item.endDate), new Date()) <= 3;

          if (!isRenewalRequest && !isActiveLoanDueSoonOrOverdue) return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const deviceName = item.device?.name?.toLowerCase() || "";
        const assetTag = item.device?.asset_tag?.toLowerCase() || "";
        const reason = item.reason?.toLowerCase() || "";
        return (
          deviceName.includes(query) ||
          assetTag.includes(query) ||
          reason.includes(query)
        );
      }

      return true;
    });
  }, [unifiedItems, statusFilter, searchQuery]);

  // Items requiring attention (overdue or due soon)
  const attentionItems = useMemo(() => {
    return activeLoans
      .filter((loan) => {
        const daysRemaining = differenceInDays(
          new Date(loan.end_date),
          new Date(),
        );
        return daysRemaining <= 3;
      })
      .map((loan) => ({
        ...loan,
        device: getDeviceById(loan.device_id),
        daysRemaining: differenceInDays(new Date(loan.end_date), new Date()),
      }));
  }, [activeLoans, getDeviceById]);

  const getUrgencyBadge = (endDate: Date) => {
    const daysRemaining = differenceInDays(endDate, new Date());
    if (daysRemaining < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          {Math.abs(daysRemaining)}
          {t("ui.day")} {t("ui.overdue")}
        </Badge>
      );
    }
    if (daysRemaining <= 3) {
      return (
        <Badge className="bg-orange-500 text-white gap-1">
          <Clock className="h-3 w-3" />
          {daysRemaining}
          {t("ui.day")} {t("ui.left")}
        </Badge>
      );
    }
    if (daysRemaining <= 7) {
      return (
        <Badge className="bg-yellow-500 text-black gap-1">
          <Clock className="h-3 w-3" />
          {daysRemaining}
          {t("ui.day")} {t("ui.left")}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        {daysRemaining}
        {t("ui.day")} {t("ui.left")}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 text-white">
            {t("loans.statusActive")}
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            {t("loans.statusPending")}
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-blue-500 text-white">
            {t("loans.statusApproved")}
          </Badge>
        );
      case "returned":
        return <Badge variant="secondary">{t("loans.statusReturned")}</Badge>;
      case "rejected":
        return <Badge variant="destructive">{t("loans.statusRejected")}</Badge>;
      case "renewal-pending":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            {t("loans.statusRenewalPending")}
          </Badge>
        );
      case "renewal-approved":
        return (
          <Badge className="bg-blue-500 text-white">
            {t("loans.statusRenewalApproved")}
          </Badge>
        );
      case "renewal-rejected":
        return (
          <Badge variant="destructive">
            {t("loans.statusRenewalRejected")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: "loan" | "renewal") => {
    if (type === "renewal") {
      return (
        <Badge
          variant="outline"
          className="text-purple-600 border-purple-600 text-xs"
        >
          {t("loans.renewal")}
        </Badge>
      );
    }
    return null;
  };

  const handleOpenReturnModal = (loan: BorrowRequestWithDetails) => {
    navigate(`/device/${loan.device_id}?action=return`);
  };

  const handleSubmitReturn = async () => {
    // Legacy modal handler - kept for bulk return reference if needed, but primary flow is now page-based
    if (!returnModalData) return;
    
    setIsSubmittingReturn(true);
    
    try {
      await createReturnRequest.mutateAsync({
        borrow_request_id: returnModalData.loan.id,
        condition: returnCondition,
        notes: returnNotes.trim() || undefined,
      });
      
      toast.success(t("loans.returnRequestSubmitted"), {
        description: t("loans.adminProcessReturn"),
      });
      setReturnModalOpen(false);
      setReturnModalData(null);
    } catch (error) {
      console.error("Failed to submit return request:", error);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleOpenRenewalModal = (loan: BorrowRequestWithDetails) => {
    navigate(`/device/${loan.device_id}?action=renew`);
  };

  const handleSubmitRenewal = async () => {
    if (!renewalModalData) return;
    
    if (renewalReason.length < 10) {
      toast.error(t("loans.reasonRequired"));
      return;
    }
    
    setIsSubmittingRenewal(true);
    
    try {
      await createRenewalRequest.mutateAsync({
        borrow_request_id: renewalModalData.loan.id,
        requested_end_date: renewalDate,
        reason: renewalReason.trim(),
      });
      
      toast.success(t("loans.renewalRequestSubmitted"), {
        description: t("loans.adminReviewRequest"),
      });
      setRenewalModalOpen(false);
      setRenewalModalData(null);
    } catch (error) {
      // Error is already handled by the mutation hook's onError
      console.error("Failed to submit renewal request:", error);
    } finally {
      setIsSubmittingRenewal(false);
    }
  };

  const hasPendingRenewal = (loanId: number) => {
    return allRenewals.some(
      (r) => r.borrow_request_id === loanId && r.status === "pending",
    );
  };



  // Timeline grouping by date
  const timelineGroups = useMemo(() => {
    const groups: { [key: string]: UnifiedLoanItem[] } = {};

    filteredItems.forEach((item) => {
      const dateKey = format(new Date(item.createdAt), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, items]) => ({
        date,
        displayDate: format(new Date(date), "MMMM d, yyyy"),
        items,
      }));
  }, [filteredItems]);

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />

      <div className="container px-4 md:px-6 pt-4">
        <BreadcrumbNav />
      </div>

      <main
        id="main-content"
        className="container px-4 md:px-6 py-8"
        tabIndex={-1}
      >
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {t("loans.activeLoansCount", { count: activeLoans.length })}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {t("loans.title")}
          </h1>
          <p className="text-muted-foreground">{t("loans.subtitle")}</p>
        </div>

        {/* Stats Overview - Clickable for quick filtering */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <SkeletonKPICard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatsCard
              title={t("loans.statsActive")}
              value={activeLoans.length}
              icon={Package}
              subtitle={t("loans.statusInUse")}
              accentColor="primary"
              onClick={() =>
                setStatusFilter(statusFilter === "active" ? "all" : "active")
              }
              className={cn(statusFilter === "active" && "ring-2 ring-primary")}
            />
            <StatsCard
              title={t("loans.statsPending")}
              value={
                pendingRequests.length +
                allRenewals.filter((r) => r.status === "pending").length
              }
              icon={Clock}
              subtitle={t("loans.awaitingApproval")}
              accentColor="warning"
              onClick={() =>
                setStatusFilter(statusFilter === "pending" ? "all" : "pending")
              }
              className={cn(
                statusFilter === "pending" && "ring-2 ring-yellow-500",
              )}
            />
            <StatsCard
              title={t("loans.statsReturned")}
              value={
                completedRequests.filter((r) => r.status === "returned").length
              }
              icon={CheckCircle2}
              subtitle={t("loans.successfullyReturned")}
              accentColor="success"
              onClick={() =>
                setStatusFilter(
                  statusFilter === "returned" ? "all" : "returned",
                )
              }
              className={cn(
                statusFilter === "returned" && "ring-2 ring-green-500",
              )}
            />
            <StatsCard
              title={t("loans.statsRejected")}
              value={
                completedRequests.filter((r) => r.status === "rejected").length
              }
              icon={XCircle}
              subtitle={t("loans.notApproved")}
              accentColor="destructive"
              onClick={() =>
                setStatusFilter(
                  statusFilter === "rejected" ? "all" : "rejected",
                )
              }
              className={cn(
                statusFilter === "rejected" && "ring-2 ring-destructive",
              )}
            />
            <StatsCard
              title={t("loans.statsRenewals")}
              value={attentionItems.length}
              icon={RefreshCw}
              subtitle={t("loans.loansDueOrOverdue")}
              accentColor="warning"
              onClick={() =>
                setStatusFilter(
                  statusFilter === "renewals" ? "all" : "renewals",
                )
              }
              className={cn(
                statusFilter === "renewals" && "ring-2 ring-orange-500",
              )}
            />
          </div>
        )}

        {/* Attention Required Section */}
        {attentionItems.length > 0 && (
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {t("loans.attentionRequired")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("loans.attentionRequiredDesc", { count: attentionItems.length }) || 
                   `${attentionItems.length} items need your attention`}
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {attentionItems.map((item) => {
                const isOverdue = differenceInDays(new Date(item.end_date), new Date()) < 0;
                
                return (
                  <Card
                    key={item.id}
                    className={cn(
                      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4",
                      isOverdue 
                        ? "border-l-red-500 hover:border-red-600" 
                        : "border-l-orange-500 hover:border-orange-600"
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex gap-4 mb-4">
                        {/* Device Image */}
                        <div className="relative h-16 w-16 shrink-0 bg-muted rounded-lg overflow-hidden border">
                          {item.device?.image_url ? (
                            <img
                              src={item.device.image_url}
                              alt={item.device.name}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <Package className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/50" />
                          )}
                        </div>
                        
                        {/* Title & Badge */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-base truncate" title={item.device?.name}>
                              {item.device?.name}
                            </h3>
                            <div className="shrink-0">
                              {getUrgencyBadge(new Date(item.end_date))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.device?.asset_tag}
                          </p>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-5 text-sm">
                        <div className="bg-muted/30 p-2 rounded-md">
                          <p className="text-xs text-muted-foreground mb-0.5">{t("loans.borrowed")}</p>
                          <p className="font-medium">
                            {format(new Date(item.start_date), "MMM d")}
                          </p>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-md">
                          <p className="text-xs text-muted-foreground mb-0.5">{t("loans.due")}</p>
                          <p className={cn("font-medium", isOverdue ? "text-red-600 dark:text-red-400" : "")}>
                            {format(new Date(item.end_date), "MMM d")}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                         <div className="flex gap-2 w-full">
                           <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2 bg-background hover:bg-accent group/btn"
                            onClick={() => handleOpenRenewalModal(item)}
                            disabled={hasPendingRenewal(item.id)}
                          >
                            <CalendarClock className="h-4 w-4 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                            {hasPendingRenewal(item.id) 
                              ? t("loans.renewalPending") 
                              : t("loans.requestRenewal")}
                          </Button>
                          <Button
                            variant="default" // Using default solid variant for primary action
                            size="sm"
                            className="flex-1 gap-2 shadow-sm"
                            onClick={() => handleOpenReturnModal(item)}
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                            {t("loans.returnDevice")}
                          </Button>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  {t("loans.allActivity")}
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="ml-2">
                      {t("loans.filtered")}: {statusFilter}
                    </Badge>
                  )}
                </CardTitle>


              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("loans.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-[200px]"
                  />
                </div>

                {/* View Toggle */}
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "timeline" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("timeline")}
                    className="rounded-l-none"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>

                {/* Clear Filter */}
                {statusFilter !== "all" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                  >
                    {t("loans.clearFilter")}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <SkeletonTable rows={5} />
            ) : filteredItems.length === 0 ? (
              <EmptyState
                type="no-loans"
                title={
                  statusFilter !== "all"
                    ? t("loans.noLoansTitle", { status: statusFilter })
                    : t("loans.noActivityTitle")
                }
                description={
                  statusFilter !== "all"
                    ? t("loans.noLoansDescFilter")
                    : t("loans.noLoansDescEmpty")
                }
                actionLabel={t("loans.browseCatalog")}
                actionHref="/catalog"
              />
            ) : viewMode === "table" ? (
              /* Table View */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>

                      <TableHead>{t("loans.device")}</TableHead>
                      <TableHead>{t("loans.type")}</TableHead>
                      <TableHead>{t("loans.period")}</TableHead>
                      <TableHead>{t("loans.status")}</TableHead>
                      <TableHead>{t("loans.created")}</TableHead>
                      <TableHead className="text-right">
                        {t("loans.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.device?.image_url && (
                              <img
                                src={item.device.image_url}
                                alt={item.device.name}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">
                                {item.device?.name || t("loans.unknownDevice")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.device?.asset_tag}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(item.type)}
                          {item.type === "loan" && (
                            <span className="text-sm text-muted-foreground">
                              {t("loans.loan")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.type === "renewal" ? (
                              <>
                                <p className="text-muted-foreground">
                                  {t("loans.current")}:{" "}
                                  {format(item.startDate, "MMM d")}
                                </p>
                                <p>
                                  {t("loans.requested")}:{" "}
                                  {format(item.endDate, "MMM d, yyyy")}
                                </p>
                              </>
                            ) : (
                              <>
                                <p>
                                  {format(item.startDate, "MMM d")} -{" "}
                                  {format(item.endDate, "MMM d, yyyy")}
                                </p>
                                {item.status === "active" &&
                                  getUrgencyBadge(item.endDate)}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(item.createdAt, "MMM d, yyyy")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.type === "loan" &&
                            item.status === "active" &&
                            item.originalLoan && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleOpenRenewalModal(item.originalLoan!)
                                    }
                                    disabled={hasPendingRenewal(item.id)}
                                  >
                                    <CalendarClock className="h-4 w-4 mr-2" />
                                    {hasPendingRenewal(item.id)
                                      ? t("loans.renewalPending")
                                      : t("loans.requestRenewal")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleOpenReturnModal(item.originalLoan!)
                                    }
                                  >
                                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                                    {t("loans.returnDevice")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* Timeline View */
              <div className="space-y-6">
                {timelineGroups.map((group) => (
                  <div key={group.date}>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm text-muted-foreground">
                        {group.displayDate}
                      </h3>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="space-y-3 pl-6 border-l-2 border-muted">
                      {group.items.map((item) => (
                        <div
                          key={`${item.type}-${item.id}`}
                          className="relative flex items-start gap-4 p-4 bg-muted/50 rounded-lg -ml-[25px]"
                        >
                          <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                          {item.device?.image_url && (
                            <img
                              src={item.device.image_url}
                              alt={item.device.name}
                              className="h-14 w-14 rounded-md object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">
                                  {item.device?.name ||
                                    t("loans.unknownDevice")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {item.device?.asset_tag}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {getTypeBadge(item.type)}
                                {getStatusBadge(item.status)}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {item.reason}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <div className="text-xs text-muted-foreground">
                                {item.type === "renewal" ? (
                                  <span>
                                    {t("loans.renewal")}:{" "}
                                    {format(item.startDate, "MMM d")} →{" "}
                                    {format(item.endDate, "MMM d, yyyy")}
                                  </span>
                                ) : (
                                  <span>
                                    {format(item.startDate, "MMM d")} -{" "}
                                    {format(item.endDate, "MMM d, yyyy")}
                                  </span>
                                )}
                              </div>
                              {item.type === "loan" &&
                                item.status === "active" &&
                                item.originalLoan && (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleOpenRenewalModal(
                                          item.originalLoan!,
                                        )
                                      }
                                      disabled={hasPendingRenewal(item.id)}
                                    >
                                      <CalendarClock className="h-4 w-4 mr-1" />
                                      {t("loans.renew")}
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() =>
                                        handleOpenReturnModal(
                                          item.originalLoan!,
                                        )
                                      }
                                    >
                                      <ArrowLeftRight className="h-4 w-4 mr-1" />
                                      {t("loans.return")}
                                    </Button>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return Modal */}
        <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                {t("loans.returnDeviceTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("loans.returnDeviceDesc")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Device Info Card */}
              <div className="flex gap-4 p-3 bg-muted rounded-lg">
                {returnModalData?.device.image_url && (
                  <img
                    src={returnModalData.device.image_url}
                    alt={returnModalData.device.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {returnModalData?.device.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {returnModalData?.device.asset_tag}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>
                      {t("loans.borrowed")}:{" "}
                      {returnModalData?.loan.start_date &&
                        format(
                          new Date(returnModalData.loan.start_date),
                          "MMM d",
                        )}
                    </span>
                    <span>
                      {t("loans.due")}:{" "}
                      {returnModalData?.loan.end_date &&
                        format(
                          new Date(returnModalData.loan.end_date),
                          "MMM d, yyyy",
                        )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Condition Selection */}
              <div className="space-y-2">
                <Label>{t("loans.deviceCondition")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      value: "excellent",
                      label: t("condition.excellent"),
                      desc: t("condition.excellentDesc"),
                      icon: CheckCircle2,
                      color: "text-green-500",
                      bg: "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800",
                    },
                    {
                      value: "good",
                      label: t("condition.good"),
                      desc: t("condition.goodDesc"),
                      icon: CheckCircle2,
                      color: "text-blue-500",
                      bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800",
                    },
                    {
                      value: "fair",
                      label: t("condition.fair"),
                      desc: t("condition.fairDesc"),
                      icon: AlertCircle,
                      color: "text-yellow-500",
                      bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-800",
                    },
                    {
                      value: "damaged",
                      label: t("condition.damaged"),
                      desc: t("condition.damagedDesc"),
                      icon: XCircle,
                      color: "text-red-500",
                      bg: "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setReturnCondition(option.value as ReturnCondition)
                      }
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border text-left transition-all",
                        returnCondition === option.value
                          ? option.bg
                          : "bg-background border-border hover:border-muted-foreground/50",
                      )}
                    >
                      <option.icon className={cn("h-4 w-4", option.color)} />
                      <div>
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {option.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t("loans.notesOptional")}</Label>
                <Textarea
                  id="notes"
                  placeholder={t("loans.notesPlaceholder")}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReturnModalOpen(false)}
                disabled={isSubmittingReturn}
              >
                {t("loans.cancel")}
              </Button>
              <Button onClick={handleSubmitReturn} disabled={isSubmittingReturn}>
                {isSubmittingReturn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {t("loans.submitting") || "Submitting..."}
                  </>
                ) : (
                  t("loans.submitReturn")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Renewal Modal */}
        <Dialog open={renewalModalOpen} onOpenChange={setRenewalModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                {t("loans.requestRenewalTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("loans.requestRenewalDesc", {
                  device: renewalModalData?.device.name,
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                {renewalModalData?.device.image_url && (
                  <img
                    src={renewalModalData.device.image_url}
                    alt={renewalModalData.device.name}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{renewalModalData?.device.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("loans.currentEnd")}:{" "}
                    {renewalModalData?.loan.end_date &&
                      format(
                        new Date(renewalModalData.loan.end_date),
                        "MMM d, yyyy",
                      )}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newEndDate">{t("loans.newEndDate")}</Label>
                <Input
                  id="newEndDate"
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  min={
                    renewalModalData?.loan.end_date
                      ? format(
                          addDays(new Date(renewalModalData.loan.end_date), 1),
                          "yyyy-MM-dd",
                        )
                      : undefined
                  }
                  max={
                    renewalModalData?.loan.end_date
                      ? format(
                          addDays(new Date(renewalModalData.loan.end_date), 90),
                          "yyyy-MM-dd",
                        )
                      : undefined
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t("loans.extendLimit")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">{t("loans.reasonForRenewal")}</Label>
                <Textarea
                  id="reason"
                  placeholder={t("loans.reasonPlaceholder")}
                  value={renewalReason}
                  onChange={(e) => setRenewalReason(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {t("loans.minCharacters")}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRenewalModalOpen(false)}
                disabled={isSubmittingRenewal}
              >
                {t("loans.cancel")}
              </Button>
              <Button
                onClick={handleSubmitRenewal}
                disabled={renewalReason.length < 10 || isSubmittingRenewal}
              >
                {isSubmittingRenewal ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {t("loans.submitting") || "Submitting..."}
                  </>
                ) : (
                  t("loans.submitRequest")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default LoanManagement;
