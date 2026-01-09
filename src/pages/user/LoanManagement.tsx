import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { UserNavbar } from "@/components/layout/UserNavbar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useAuth } from "@/contexts/AuthContext";
import {
  getRenewalsByBorrowRequest,
  type BookingRequest,
  type Device,
} from "@/lib/mockData";
import { useUserRequests, useDevices } from "@/hooks/use-data-cache";
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
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { toast } from "sonner";
import { StatsCard } from "@/components/ui/stats-card";
import { SkeletonKPICard, SkeletonTable } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type ReturnCondition = "excellent" | "good" | "fair" | "damaged";

interface ReturnModalData {
  loan: BookingRequest;
  device: Device;
}

interface RenewalModalData {
  loan: BookingRequest;
  device: Device;
}

const LoanManagement: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL or default to "active"
  const tabFromUrl = searchParams.get("tab");
  const validTabs = ["active", "pending", "renewals", "history"];
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "active";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Sync tab changes to URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  
  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnModalData, setReturnModalData] = useState<ReturnModalData | null>(null);
  const [returnCondition, setReturnCondition] = useState<ReturnCondition>("good");
  const [returnNotes, setReturnNotes] = useState("");
  
  // Renewal modal state
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [renewalModalData, setRenewalModalData] = useState<RenewalModalData | null>(null);
  const [renewalDate, setRenewalDate] = useState("");
  const [renewalReason, setRenewalReason] = useState("");

  const userId = user?.id || "2";
  
  // Use cached data
  const { data: userRequests = [], isLoading: requestsLoading } = useUserRequests(userId);
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  
  const isLoading = requestsLoading || devicesLoading;

  // Create a device lookup map for efficient access
  const deviceMap = useMemo((): Map<string, Device> => {
    return new Map(devices.map(d => [d.id, d]));
  }, [devices]);

  const getDeviceById = (id: string): Device | undefined => deviceMap.get(id);

  const activeLoans = useMemo(() => 
    userRequests.filter((r) => r.status === "active"), [userRequests]);
  const pendingRequests = useMemo(() => 
    userRequests.filter((r) => r.status === "pending"), [userRequests]);
  const completedRequests = useMemo(() => 
    userRequests.filter((r) => r.status === "returned" || r.status === "rejected"), [userRequests]);

  // Get all renewal requests for user's loans
  const allRenewals = useMemo(() => activeLoans.flatMap((loan) =>
    getRenewalsByBorrowRequest(loan.id).map((renewal) => ({
      ...renewal,
      loan,
      device: deviceMap.get(loan.deviceId),
    }))
  ), [activeLoans, deviceMap]);

  const getUrgencyBadge = (endDate: string) => {
    const daysRemaining = differenceInDays(new Date(endDate), new Date());
    if (daysRemaining < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          {Math.abs(daysRemaining)}d overdue
        </Badge>
      );
    }
    if (daysRemaining <= 3) {
      return (
        <Badge className="bg-orange-500 text-white gap-1">
          <Clock className="h-3 w-3" />
          {daysRemaining}d left
        </Badge>
      );
    }
    if (daysRemaining <= 7) {
      return (
        <Badge className="bg-yellow-500 text-black gap-1">
          <Clock className="h-3 w-3" />
          {daysRemaining}d left
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        {daysRemaining}d left
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-500 text-white">Approved</Badge>;
      case "returned":
        return <Badge variant="secondary">Returned</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleOpenReturnModal = (loan: BookingRequest) => {
    const device = getDeviceById(loan.deviceId);
    if (device) {
      setReturnModalData({ loan, device });
      setReturnCondition("good");
      setReturnNotes("");
      setReturnModalOpen(true);
    }
  };

  const handleSubmitReturn = () => {
    toast.success("Return request submitted", {
      description: "An admin will process your return shortly.",
    });
    setReturnModalOpen(false);
    setReturnModalData(null);
  };

  const handleOpenRenewalModal = (loan: BookingRequest) => {
    const device = getDeviceById(loan.deviceId);
    if (device) {
      setRenewalModalData({ loan, device });
      const defaultDate = format(addDays(new Date(loan.endDate), 14), "yyyy-MM-dd");
      setRenewalDate(defaultDate);
      setRenewalReason("");
      setRenewalModalOpen(true);
    }
  };

  const handleSubmitRenewal = () => {
    if (renewalReason.length < 10) {
      toast.error("Please provide a reason (at least 10 characters)");
      return;
    }
    toast.success("Renewal request submitted", {
      description: "An admin will review your request shortly.",
    });
    setRenewalModalOpen(false);
    setRenewalModalData(null);
  };

  const hasPendingRenewal = (loanId: string) => {
    return getRenewalsByBorrowRequest(loanId).some((r) => r.status === "pending");
  };

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />

      <div className="container px-4 md:px-6 pt-4">
        <BreadcrumbNav />
      </div>

      <main id="main-content" className="container px-4 md:px-6 py-8" tabIndex={-1}>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {activeLoans.length} active loan{activeLoans.length !== 1 ? "s" : ""}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Loan Management</h1>
          <p className="text-muted-foreground">
            View and manage your device loans, returns, and renewal requests.
          </p>
        </div>

        {/* Stats Overview */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <SkeletonKPICard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Active Loans"
              value={activeLoans.length}
              icon={Package}
              subtitle="Currently borrowed"
              accentColor="primary"
              onClick={() => handleTabChange("active")}
            />
            <StatsCard
              title="Pending Requests"
              value={pendingRequests.length}
              icon={Clock}
              subtitle="Awaiting approval"
              accentColor="warning"
              onClick={() => handleTabChange("pending")}
            />
            <StatsCard
              title="Pending Renewals"
              value={allRenewals.filter((r) => r.status === "pending").length}
              icon={RefreshCw}
              subtitle="Renewal requests"
              accentColor="success"
              onClick={() => handleTabChange("renewals")}
            />
            <StatsCard
              title="Completed"
              value={completedRequests.length}
              icon={History}
              subtitle="Past transactions"
              accentColor="destructive"
              onClick={() => handleTabChange("history")}
            />
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="active" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Active</span>
              {activeLoans.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {activeLoans.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Pending</span>
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="renewals" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Renewals</span>
              {allRenewals.filter((r) => r.status === "pending").length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {allRenewals.filter((r) => r.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          {/* Active Loans Tab */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Active Loans
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <SkeletonTable rows={3} />
                ) : activeLoans.length === 0 ? (
                  <EmptyState
                    type="no-loans"
                    title="No active loans"
                    description="You don't have any devices currently borrowed."
                    actionLabel="Browse Catalog"
                    actionHref="/catalog"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Device</TableHead>
                          <TableHead>Borrowed</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeLoans.map((loan) => {
                          const device = getDeviceById(loan.deviceId);
                          const pendingRenewal = hasPendingRenewal(loan.id);
                          return (
                            <TableRow key={loan.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {device?.image && (
                                    <img
                                      src={device.image}
                                      alt={device.name}
                                      className="h-10 w-10 rounded-md object-cover"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{device?.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {device?.assetTag}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {format(new Date(loan.startDate), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span>{format(new Date(loan.endDate), "MMM d, yyyy")}</span>
                                  {getUrgencyBadge(loan.endDate)}
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(loan.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenRenewalModal(loan)}
                                    disabled={pendingRenewal}
                                    className="gap-1"
                                  >
                                    <CalendarClock className="h-4 w-4" />
                                    {pendingRenewal ? "Pending" : "Renew"}
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleOpenReturnModal(loan)}
                                    className="gap-1"
                                  >
                                    <ArrowLeftRight className="h-4 w-4" />
                                    Return
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Requests Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <SkeletonTable rows={3} />
                ) : pendingRequests.length === 0 ? (
                  <EmptyState
                    type="no-requests"
                    title="No pending requests"
                    description="All your borrow requests have been processed."
                    actionLabel="Browse Catalog"
                    actionHref="/catalog"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Device</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingRequests.map((request) => {
                          const device = getDeviceById(request.deviceId);
                          return (
                            <TableRow key={request.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {device?.image && (
                                    <img
                                      src={device.image}
                                      alt={device.name}
                                      className="h-10 w-10 rounded-md object-cover"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{device?.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {device?.assetTag}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {format(new Date(request.createdAt), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p>{format(new Date(request.startDate), "MMM d")} -</p>
                                  <p>{format(new Date(request.endDate), "MMM d, yyyy")}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                                  {request.reason}
                                </p>
                              </TableCell>
                              <TableCell>{getStatusBadge(request.status)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Renewals Tab */}
          <TabsContent value="renewals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Renewal Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <SkeletonTable rows={3} />
                ) : allRenewals.length === 0 ? (
                  <EmptyState
                    type="no-requests"
                    title="No renewal requests"
                    description="You haven't submitted any renewal requests yet."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Device</TableHead>
                          <TableHead>Current End</TableHead>
                          <TableHead>Requested End</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allRenewals.map((renewal) => (
                          <TableRow key={renewal.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {renewal.device?.image && (
                                  <img
                                    src={renewal.device.image}
                                    alt={renewal.device.name}
                                    className="h-10 w-10 rounded-md object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-medium">{renewal.device?.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {renewal.device?.assetTag}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(renewal.currentEndDate), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              {format(new Date(renewal.requestedEndDate), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                                {renewal.reason}
                              </p>
                            </TableCell>
                            <TableCell>{getStatusBadge(renewal.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Loan History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <SkeletonTable rows={3} />
                ) : completedRequests.length === 0 ? (
                  <EmptyState
                    type="no-requests"
                    title="No history yet"
                    description="Your completed loan transactions will appear here."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Device</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedRequests.map((request) => {
                          const device = getDeviceById(request.deviceId);
                          return (
                            <TableRow key={request.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {device?.image && (
                                    <img
                                      src={device.image}
                                      alt={device.name}
                                      className="h-10 w-10 rounded-md object-cover"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{device?.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {device?.assetTag}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p>{format(new Date(request.startDate), "MMM d")} -</p>
                                  <p>{format(new Date(request.endDate), "MMM d, yyyy")}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                                  {request.reason}
                                </p>
                              </TableCell>
                              <TableCell>{getStatusBadge(request.status)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Return Modal */}
        <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                Return Device
              </DialogTitle>
              <DialogDescription>
                Submit a return request for {returnModalData?.device.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                {returnModalData?.device.image && (
                  <img
                    src={returnModalData.device.image}
                    alt={returnModalData.device.name}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{returnModalData?.device.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {returnModalData?.device.assetTag}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Device Condition</Label>
                <Select
                  value={returnCondition}
                  onValueChange={(v) => setReturnCondition(v as ReturnCondition)}
                >
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Excellent - Like new
                      </div>
                    </SelectItem>
                    <SelectItem value="good">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        Good - Minor wear
                      </div>
                    </SelectItem>
                    <SelectItem value="fair">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        Fair - Visible wear
                      </div>
                    </SelectItem>
                    <SelectItem value="damaged">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Damaged - Needs repair
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about the device condition..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReturnModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReturn}>Submit Return</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Renewal Modal */}
        <Dialog open={renewalModalOpen} onOpenChange={setRenewalModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Request Renewal
              </DialogTitle>
              <DialogDescription>
                Extend your loan period for {renewalModalData?.device.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                {renewalModalData?.device.image && (
                  <img
                    src={renewalModalData.device.image}
                    alt={renewalModalData.device.name}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{renewalModalData?.device.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current end: {renewalModalData?.loan.endDate && format(new Date(renewalModalData.loan.endDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newEndDate">New End Date</Label>
                <Input
                  id="newEndDate"
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  min={renewalModalData?.loan.endDate ? format(addDays(new Date(renewalModalData.loan.endDate), 1), "yyyy-MM-dd") : undefined}
                  max={renewalModalData?.loan.endDate ? format(addDays(new Date(renewalModalData.loan.endDate), 90), "yyyy-MM-dd") : undefined}
                />
                <p className="text-xs text-muted-foreground">
                  You can extend up to 90 days from the current end date
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Renewal</Label>
                <Textarea
                  id="reason"
                  placeholder="Please explain why you need to extend the loan period..."
                  value={renewalReason}
                  onChange={(e) => setRenewalReason(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 characters required
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenewalModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRenewal} disabled={renewalReason.length < 10}>
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default LoanManagement;
