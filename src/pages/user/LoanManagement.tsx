import React, { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
type StatusFilter = "all" | "active" | "pending" | "returned" | "rejected";

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

  // View and filter state
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnModalData, setReturnModalData] =
    useState<ReturnModalData | null>(null);
  const [returnCondition, setReturnCondition] =
    useState<ReturnCondition>("good");
  const [returnNotes, setReturnNotes] = useState("");

  // Renewal modal state
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [renewalModalData, setRenewalModalData] =
    useState<RenewalModalData | null>(null);
  const [renewalDate, setRenewalDate] = useState("");
  const [renewalReason, setRenewalReason] = useState("");

  // Bulk return state
  const [selectedLoans, setSelectedLoans] = useState<number[]>([]);
  const [bulkReturnModalOpen, setBulkReturnModalOpen] = useState(false);
  const [bulkReturnCondition, setBulkReturnCondition] =
    useState<ReturnCondition>("good");
  const [bulkReturnNotes, setBulkReturnNotes] = useState("");

  // Data fetching
  const { data: userRequests = [], isLoading: requestsLoading } =
    useUserBorrowRequests(user?.id ?? 0);
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const { data: allRenewalRequests = [] } = useRenewals();
  const isLoading = requestsLoading || devicesLoading;

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
    const device = getDeviceById(loan.device_id);
    if (device) {
      setReturnModalData({ loan, device });
      setReturnCondition("good");
      setReturnNotes("");
      setReturnModalOpen(true);
    }
  };

  const handleSubmitReturn = () => {
    toast.success(t("loans.returnRequestSubmitted"), {
      description: t("loans.adminProcessReturn"),
    });
    setReturnModalOpen(false);
    setReturnModalData(null);
  };

  const handleOpenRenewalModal = (loan: BorrowRequestWithDetails) => {
    const device = getDeviceById(loan.device_id);
    if (device) {
      setRenewalModalData({ loan, device });
      const defaultDate = format(
        addDays(new Date(loan.end_date), 14),
        "yyyy-MM-dd",
      );
      setRenewalDate(defaultDate);
      setRenewalReason("");
      setRenewalModalOpen(true);
    }
  };

  const handleSubmitRenewal = () => {
    if (renewalReason.length < 10) {
      toast.error(t("loans.reasonRequired"));
      return;
    }
    toast.success(t("loans.renewalRequestSubmitted"), {
      description: t("loans.adminReviewRequest"),
    });
    setRenewalModalOpen(false);
    setRenewalModalData(null);
  };

  const hasPendingRenewal = (loanId: number) => {
    return allRenewals.some(
      (r) => r.borrow_request_id === loanId && r.status === "pending",
    );
  };

  // Bulk return handlers
  const handleToggleLoanSelection = (loanId: number) => {
    setSelectedLoans((prev) =>
      prev.includes(loanId)
        ? prev.filter((id) => id !== loanId)
        : [...prev, loanId],
    );
  };

  const handleSelectAllActiveLoans = () => {
    if (selectedLoans.length === activeLoans.length) {
      setSelectedLoans([]);
    } else {
      setSelectedLoans(activeLoans.map((loan) => loan.id));
    }
  };

  const handleOpenBulkReturnModal = () => {
    if (selectedLoans.length === 0) {
      toast.error(t("loans.noLoansSelected"), {
        description: t("loans.selectAtLeastOne"),
      });
      return;
    }
    setBulkReturnCondition("good");
    setBulkReturnNotes("");
    setBulkReturnModalOpen(true);
  };

  const handleSubmitBulkReturn = () => {
    const count = selectedLoans.length;
    toast.success(t("loans.bulkReturnSubmitted", { count }), {
      description: t("loans.adminProcessReturn"),
    });
    setBulkReturnModalOpen(false);
    setSelectedLoans([]);
  };

  const selectedLoansData = useMemo(() => {
    return activeLoans
      .filter((loan) => selectedLoans.includes(loan.id))
      .map((loan) => ({
        ...loan,
        device: getDeviceById(loan.device_id),
      }));
  }, [activeLoans, selectedLoans, getDeviceById]);

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonKPICard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title={t("loans.statsActive")}
              value={activeLoans.length}
              icon={Package}
              subtitle={t("loans.currentlyBorrowed")}
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
          </div>
        )}

        {/* Attention Required Section */}
        {attentionItems.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertCircle className="h-5 w-5" />
                {t("loans.attentionRequired")} ({attentionItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {attentionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-background rounded-lg border"
                  >
                    {item.device?.image_url && (
                      <img
                        src={item.device.image_url}
                        alt={item.device.name}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.device?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getUrgencyBadge(new Date(item.end_date))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRenewalModal(item)}
                        disabled={hasPendingRenewal(item.id)}
                        title={t("loans.requestRenewal")}
                      >
                        <CalendarClock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenReturnModal(item)}
                        title={t("loans.returnDevice")}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

                {/* Bulk Actions */}
                {selectedLoans.length > 0 && (
                  <div className="flex items-center gap-2 pl-3 border-l">
                    <Badge variant="secondary">
                      {selectedLoans.length}{" "}
                      {t("common.selected", { defaultValue: "selected" })}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={handleOpenBulkReturnModal}
                      className="gap-1"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                      {t("loans.returnSelected")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLoans([])}
                    >
                      {t("loans.clear")}
                    </Button>
                  </div>
                )}
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
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={
                            activeLoans.length > 0 &&
                            selectedLoans.length === activeLoans.length
                          }
                          onCheckedChange={handleSelectAllActiveLoans}
                          aria-label="Select all active loans"
                        />
                      </TableHead>
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
                          {item.type === "loan" && item.status === "active" ? (
                            <Checkbox
                              checked={selectedLoans.includes(item.id)}
                              onCheckedChange={() =>
                                handleToggleLoanSelection(item.id)
                              }
                              aria-label={`Select ${item.device?.name}`}
                            />
                          ) : (
                            <span className="w-4" />
                          )}
                        </TableCell>
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
              >
                {t("loans.cancel")}
              </Button>
              <Button onClick={handleSubmitReturn}>
                {t("loans.submitReturn")}
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
              >
                {t("loans.cancel")}
              </Button>
              <Button
                onClick={handleSubmitRenewal}
                disabled={renewalReason.length < 10}
              >
                {t("loans.submitRequest")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Return Modal */}
        <Dialog
          open={bulkReturnModalOpen}
          onOpenChange={setBulkReturnModalOpen}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                {t("loans.returnMultipleTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("loans.returnMultipleDesc", { count: selectedLoans.length })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Selected Devices List */}
              <div className="space-y-2">
                <Label>{t("loans.devicesToReturn")}</Label>
                <div className="max-h-[200px] overflow-y-auto space-y-2 rounded-lg border p-2">
                  {selectedLoansData.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 bg-muted/50 rounded-md"
                    >
                      {item.device?.image_url && (
                        <img
                          src={item.device.image_url}
                          alt={item.device?.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.device?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.device?.asset_tag}
                        </p>
                      </div>
                      {getUrgencyBadge(new Date(item.end_date))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Condition Selection */}
              <div className="space-y-2">
                <Label>{t("loans.overallCondition")}</Label>
                <Select
                  value={bulkReturnCondition}
                  onValueChange={(v) =>
                    setBulkReturnCondition(v as ReturnCondition)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">
                      {t("condition.excellent")} -{" "}
                      {t("condition.excellentDesc")}
                    </SelectItem>
                    <SelectItem value="good">
                      {t("condition.good")} - {t("condition.goodDesc")}
                    </SelectItem>
                    <SelectItem value="fair">
                      {t("condition.fair")} - {t("condition.fairDesc")}
                    </SelectItem>
                    <SelectItem value="damaged">
                      {t("condition.damaged")} - {t("condition.damagedDesc")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("loans.conditionDid")}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="bulkNotes">{t("loans.notesOptional")}</Label>
                <Textarea
                  id="bulkNotes"
                  placeholder={t("loans.bulkNotesPlaceholder")}
                  value={bulkReturnNotes}
                  onChange={(e) => setBulkReturnNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBulkReturnModalOpen(false)}
              >
                {t("loans.cancel")}
              </Button>
              <Button onClick={handleSubmitBulkReturn}>
                {t("loans.submitReturns", { count: selectedLoans.length })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default LoanManagement;
