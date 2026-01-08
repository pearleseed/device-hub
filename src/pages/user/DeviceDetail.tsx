import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserNavbar } from "@/components/layout/UserNavbar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { equipmentAPI, usersAPI, borrowingAPI } from "@/lib/api";
import type { Equipment, User, DeviceStatus } from "@/lib/types";
import { getCategoryIcon } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [device, setDevice] = useState<Equipment | null>(null);
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const deviceRes = await equipmentAPI.getById(parseInt(id));
        if (deviceRes.success && deviceRes.data) {
          setDevice(deviceRes.data);

          if (deviceRes.data.assigned_to_id) {
            const userRes = await usersAPI.getById(
              deviceRes.data.assigned_to_id,
            );
            if (userRes.success && userRes.data) {
              setAssignedUser(userRes.data);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching device:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UserNavbar />
        <main className="container px-4 md:px-6 py-8 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading device...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-background">
        <UserNavbar />
        <main className="container px-4 md:px-6 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="font-semibold mb-2">Device Not Found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                The device you're looking for doesn't exist.
              </p>
              <Button onClick={() => navigate("/catalog")}>
                Back to Catalog
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const statusColors: Record<DeviceStatus, string> = {
    available: "bg-status-available text-status-available-foreground",
    borrowed: "bg-status-borrowed text-status-borrowed-foreground",
    maintenance: "bg-status-maintenance text-status-maintenance-foreground",
  };

  const specLabels: Record<string, string> = {
    os: "Operating System",
    processor: "Processor",
    ram: "RAM",
    storage: "Storage",
    display: "Display",
    battery: "Battery",
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

        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Image Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                <img
                  src={device.image_url}
                  alt={device.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>

          {/* Details Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {getCategoryIcon(device.category)}
                  </span>
                  <div>
                    <CardTitle className="text-2xl">{device.name}</CardTitle>
                    <p className="text-muted-foreground">{device.asset_tag}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-6">
                  <Badge className={statusColors[device.status]}>
                    {device.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {device.brand} • {device.model}
                  </span>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <h4 className="font-semibold">Specifications</h4>
                  <dl className="space-y-2 text-sm">
                    {Object.entries(device.specs || {}).map(
                      ([key, value]) =>
                        value && (
                          <div key={key} className="flex justify-between">
                            <dt className="text-muted-foreground">
                              {specLabels[key] || key}
                            </dt>
                            <dd className="font-medium text-right max-w-[60%]">
                              {value}
                            </dd>
                          </div>
                        ),
                    )}
                  </dl>
                </div>

                {device.status === "borrowed" && assignedUser && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-background">
                        <img
                          src={assignedUser.avatar_url || ""}
                          alt={assignedUser.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Currently assigned to
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {assignedUser.name}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {device.status === "available" && (
                  <Button
                    className="w-full mt-6"
                    onClick={() => navigate(`/catalog?device=${device.id}`)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Request to Borrow
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Purchase Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Purchase Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Purchase Price</dt>
                    <dd className="font-medium">
                      ${device.purchase_price.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Purchase Date</dt>
                    <dd className="font-medium">
                      {new Date(device.purchase_date).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Department</dt>
                    <dd className="font-medium">
                      {device.department_name || "N/A"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeviceDetail;
