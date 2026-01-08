import React, { useState, useEffect } from "react";
import { UserNavbar } from "@/components/layout/UserNavbar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { borrowingAPI, equipmentAPI } from "@/lib/api";
import type { BorrowingRequest, Equipment } from "@/lib/types";
import { Mail, Building2, Calendar, Package } from "lucide-react";
import { format } from "date-fns";

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BorrowingRequest[]>([]);
  const [devices, setDevices] = useState<Map<number, Equipment>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const [requestsRes, devicesRes] = await Promise.all([
          borrowingAPI.getByUser(user.id),
          equipmentAPI.getAll(),
        ]);

        if (requestsRes.success && requestsRes.data) {
          setRequests(requestsRes.data);
        }
        if (devicesRes.success && devicesRes.data) {
          const deviceMap = new Map<number, Equipment>();
          devicesRes.data.forEach((d) => deviceMap.set(d.id, d));
          setDevices(deviceMap);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const getDevice = (equipmentId: number) => devices.get(equipmentId);

  if (!user) return null;

  const activeLoans = requests.filter((r) => r.status === "active");
  const totalRequests = requests.length;
  const returnedCount = requests.filter((r) => r.status === "returned").length;

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />

      <main
        id="main-content"
        className="container px-4 md:px-6 py-8"
        tabIndex={-1}
      >
        <BreadcrumbNav />

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user.avatar_url || ""} alt={user.name} />
                  <AvatarFallback className="text-2xl">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                  className="mt-2"
                >
                  {user.role}
                </Badge>

                <Separator className="my-6" />

                <div className="w-full space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {user.department_name || "No department"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Joined {format(new Date(user.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats and Activity */}
          <div className="md:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{activeLoans.length}</p>
                      <p className="text-sm text-muted-foreground">
                        Active Loans
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalRequests}</p>
                      <p className="text-sm text-muted-foreground">
                        Total Requests
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <Package className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{returnedCount}</p>
                      <p className="text-sm text-muted-foreground">Returned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : requests.length === 0 ? (
                  <p className="text-muted-foreground">
                    No borrowing history yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {requests.slice(0, 5).map((request) => {
                      const device = getDevice(request.equipment_id);
                      return (
                        <div
                          key={request.id}
                          className="flex items-center gap-4"
                        >
                          {device && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={device.image_url}
                                alt={device.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {device?.name || "Unknown Device"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(request.start_date), "MMM d")} -{" "}
                              {format(
                                new Date(request.end_date),
                                "MMM d, yyyy",
                              )}
                            </p>
                          </div>
                          <Badge variant="outline">{request.status}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
