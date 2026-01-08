import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserNavbar } from "@/components/layout/UserNavbar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { borrowingAPI, equipmentAPI } from "@/lib/api";
import type { BorrowingRequest, Equipment } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Clock, ArrowRight, Monitor, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ActiveLoanCard } from "@/components/user/ActiveLoanCard";
import { RequestTimeline } from "@/components/user/RequestTimeline";
import { RecentlyViewedSection } from "@/components/user/RecentlyViewedSection";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { toast } from "sonner";
import { SkeletonKPICard, SkeletonTable } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
  const [isLoading, setIsLoading] = useState(true);
  const [userRequests, setUserRequests] = useState<BorrowingRequest[]>([]);
  const [equipmentMap, setEquipmentMap] = useState<Map<number, Equipment>>(
    new Map(),
  );

  const loansRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Fetch user requests and equipment data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        // Fetch user's borrowing requests
        const requestsResponse = await borrowingAPI.getByUser(user.id);
        if (requestsResponse.success && requestsResponse.data) {
          setUserRequests(requestsResponse.data);

          // Fetch equipment details for each request
          const equipmentIds = [
            ...new Set(requestsResponse.data.map((r) => r.equipment_id)),
          ];
          const equipmentPromises = equipmentIds.map((id) =>
            equipmentAPI.getById(id),
          );
          const equipmentResults = await Promise.all(equipmentPromises);

          const map = new Map<number, Equipment>();
          equipmentResults.forEach((result) => {
            if (result.success && result.data) {
              map.set(result.data.id, result.data);
            }
          });
          setEquipmentMap(map);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const activeLoans = userRequests.filter((r) => r.status === "active");
  const pendingRequests = userRequests.filter((r) => r.status === "pending");

  const getDeviceInfo = (request: BorrowingRequest): Equipment | undefined => {
    return equipmentMap.get(request.equipment_id);
  };

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleScrollToLoans = () => {
    loansRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReturn = async (loanId: string) => {
    // TODO: Implement actual return request creation
    toast.success("Return request submitted", {
      description: "An admin will process your return shortly.",
    });
  };

  const handleDeviceClick = (device: { id: number }) => {
    navigate(`/catalog?device=${device.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />

      <main
        id="main-content"
        className="container px-4 md:px-6 py-8"
        tabIndex={-1}
      >
        <BreadcrumbNav />

        {/* Enhanced Welcome Section */}
        <section className="pt-6 pb-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {getGreeting()}, {user?.name?.split(" ")[0] || "User"} 👋
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your device loans and requests.
          </p>
        </section>

        {/* Interactive KPI Cards */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <SkeletonKPICard />
            <SkeletonKPICard />
            <SkeletonKPICard />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <StatsCard
              title="Active Loans"
              value={activeLoans.length}
              subtitle="Devices currently borrowed"
              icon={Package}
              onClick={handleScrollToLoans}
              accentColor={activeLoans.length > 0 ? "success" : "default"}
            />

            <StatsCard
              title="Pending Requests"
              value={pendingRequests.length}
              subtitle="Awaiting approval"
              icon={Clock}
              onClick={handleScrollToHistory}
              accentColor={pendingRequests.length > 0 ? "warning" : "default"}
            />

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Quick Actions
                </CardTitle>
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
        )}

        {/* Recently Viewed Section */}
        {recentlyViewed.length > 0 && (
          <RecentlyViewedSection
            deviceIds={recentlyViewed}
            onClear={clearRecentlyViewed}
            onDeviceClick={handleDeviceClick}
            className="mb-8"
          />
        )}

        {/* Pending Request Timeline */}
        {pendingRequests.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {pendingRequests.map((request) => {
                const device = getDeviceInfo(request);
                if (!device) return null;

                return (
                  <div
                    key={request.id}
                    className="p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={device.image_url}
                          alt={device.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{device.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.start_date), "MMM d")} -{" "}
                          {format(new Date(request.end_date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <RequestTimeline
                      status={request.status}
                      createdAt={request.created_at}
                    />
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Estimated approval: 1-2 business days
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Active Loans with Enhanced Cards */}
        <div ref={loansRef}>
          {activeLoans.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Currently Borrowed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {activeLoans.map((loan) => {
                    const device = getDeviceInfo(loan);
                    if (!device) return null;

                    // Convert to legacy format for ActiveLoanCard
                    const legacyDevice = {
                      id: String(device.id),
                      name: device.name,
                      category: device.category,
                      brand: device.brand,
                      model: device.model,
                      assetTag: device.asset_tag,
                      status: device.status,
                      assignedTo: device.assigned_to_id
                        ? String(device.assigned_to_id)
                        : null,
                      specs: device.specs,
                      image: device.image_url,
                      addedDate: device.created_at,
                    };

                    const legacyLoan = {
                      id: String(loan.id),
                      deviceId: String(loan.equipment_id),
                      userId: String(loan.user_id),
                      startDate: loan.start_date,
                      endDate: loan.end_date,
                      reason: loan.reason,
                      status: loan.status,
                      createdAt: loan.created_at,
                    };

                    return (
                      <ActiveLoanCard
                        key={loan.id}
                        loan={legacyLoan}
                        device={legacyDevice}
                        onReturn={handleReturn}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Request History */}
        <Card ref={historyRef}>
          <CardHeader>
            <CardTitle>Request History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonTable rows={4} className="border-0" />
            ) : userRequests.length > 0 ? (
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
                  {userRequests.map((request) => {
                    const device = getDeviceInfo(request);
                    if (!device) return null;

                    return (
                      <TableRow key={request.id} className="animate-fade-in">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={device.image_url}
                                alt={device.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{device.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {device.asset_tag}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>
                              {format(new Date(request.start_date), "MMM d")}
                            </p>
                            <p className="text-muted-foreground">
                              to{" "}
                              {format(
                                new Date(request.end_date),
                                "MMM d, yyyy",
                              )}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(request.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                type="no-requests"
                actionLabel="Browse Catalog"
                actionHref="/catalog"
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserDashboard;
