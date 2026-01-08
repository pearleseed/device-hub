import React, { useState, useEffect, useCallback } from "react";
import { UserNavbar } from "@/components/layout/UserNavbar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { borrowingAPI, equipmentAPI } from "@/lib/api";
import type {
  BorrowingRequest,
  Equipment,
  DeviceCategory,
  DeviceStatus,
  RequestStatus,
} from "@/lib/types";
import { getCategoryIcon } from "@/lib/types";
import { ReturnDeviceModal } from "@/components/devices/ReturnDeviceModal";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { format, differenceInDays, parseISO, isAfter } from "date-fns";

// Legacy interfaces
interface Device {
  id: string;
  name: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  assetTag: string;
  status: DeviceStatus;
  assignedTo: string | null;
  specs: Record<string, string | undefined>;
  image: string;
  addedDate: string;
}

interface BookingRequest {
  id: string;
  deviceId: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
}

const MyBorrowedDevices: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [devices, setDevices] = useState<Map<string, Device>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [returnModal, setReturnModal] = useState<{
    device: Device;
    loan: BookingRequest;
  } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [requestsRes, devicesRes] = await Promise.all([
        borrowingAPI.getByUser(user.id),
        equipmentAPI.getAll(),
      ]);

      if (requestsRes.success && requestsRes.data) {
        const legacyRequests = requestsRes.data.map((r) => ({
          id: String(r.id),
          deviceId: String(r.equipment_id),
          userId: String(r.user_id),
          startDate: r.start_date,
          endDate: r.end_date,
          reason: r.reason,
          status: r.status,
          createdAt: r.created_at,
        }));
        setRequests(legacyRequests);
      }

      if (devicesRes.success && devicesRes.data) {
        const deviceMap = new Map<string, Device>();
        devicesRes.data.forEach((eq) => {
          deviceMap.set(String(eq.id), {
            id: String(eq.id),
            name: eq.name,
            category: eq.category,
            brand: eq.brand,
            model: eq.model,
            assetTag: eq.asset_tag,
            status: eq.status,
            assignedTo: eq.assigned_to_id ? String(eq.assigned_to_id) : null,
            specs: eq.specs as Record<string, string | undefined>,
            image: eq.image_url,
            addedDate: eq.created_at,
          });
        });
        setDevices(deviceMap);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDevice = (deviceId: string) => devices.get(deviceId);

  const activeLoans = requests.filter((r) => r.status === "active");
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const pastRequests = requests.filter(
    (r) => r.status === "returned" || r.status === "rejected",
  );

  const statusIcons: Record<RequestStatus, React.ReactNode> = {
    pending: <Clock className="h-4 w-4 text-yellow-500" />,
    approved: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
    active: <Package className="h-4 w-4 text-primary" />,
    returned: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    rejected: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const renderRequestCard = (
    request: BookingRequest,
    showReturnButton = false,
  ) => {
    const device = getDevice(request.deviceId);
    if (!device) return null;

    const endDate = parseISO(request.endDate);
    const today = new Date();
    const daysRemaining = differenceInDays(endDate, today);
    const isOverdue = isAfter(today, endDate);

    return (
      <Card
        key={request.id}
        className={
          isOverdue && request.status === "active" ? "border-destructive" : ""
        }
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img
                src={device.image}
                alt={device.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">
                  {getCategoryIcon(device.category)}
                </span>
                <h3 className="font-semibold truncate">{device.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{device.assetTag}</p>

              <div className="flex items-center gap-2 mt-2">
                {statusIcons[request.status]}
                <span className="text-sm capitalize">{request.status}</span>
                {isOverdue && request.status === "active" && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
                {!isOverdue &&
                  request.status === "active" &&
                  daysRemaining <= 3 && (
                    <Badge
                      variant="outline"
                      className="border-yellow-500 text-yellow-600"
                    >
                      {daysRemaining} days left
                    </Badge>
                  )}
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(request.startDate), "MMM d")} -{" "}
                {format(new Date(request.endDate), "MMM d, yyyy")}
              </p>
            </div>

            {showReturnButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReturnModal({ device, loan: request })}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Return
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UserNavbar />
        <main className="container px-4 md:px-6 py-8 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading your devices...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />

      <main
        id="main-content"
        className="container px-4 md:px-6 py-8"
        tabIndex={-1}
      >
        <BreadcrumbNav />

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Devices</h1>
          <p className="text-muted-foreground">
            Manage your borrowed devices and requests.
          </p>
        </div>

        <Tabs defaultValue="active">
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              Active ({activeLoans.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingRequests.length + approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              History ({pastRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeLoans.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Active Loans</h3>
                  <p className="text-muted-foreground text-sm">
                    You don't have any devices currently borrowed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeLoans.map((request) => renderRequestCard(request, true))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length === 0 && approvedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Pending Requests</h3>
                  <p className="text-muted-foreground text-sm">
                    All your requests have been processed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {approvedRequests.map((request) => renderRequestCard(request))}
                {pendingRequests.map((request) => renderRequestCard(request))}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {pastRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No History</h3>
                  <p className="text-muted-foreground text-sm">
                    Your completed requests will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pastRequests.map((request) => renderRequestCard(request))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Return Modal */}
      <ReturnDeviceModal
        device={returnModal?.device || null}
        loan={returnModal?.loan || null}
        open={!!returnModal}
        onClose={() => setReturnModal(null)}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default MyBorrowedDevices;
