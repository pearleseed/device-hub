import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { equipmentAPI, usersAPI } from "@/lib/api";
import type { Equipment, User, RequestStatus } from "@/lib/types";
import { format } from "date-fns";

// Legacy request type
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

interface RequestListViewProps {
  requests: BookingRequest[];
  onStatusChange: (id: string, status: RequestStatus) => void;
}

const statusOptions: RequestStatus[] = [
  "pending",
  "approved",
  "active",
  "returned",
  "rejected",
];

const statusColors: Record<RequestStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  active: "bg-status-available text-status-available-foreground",
  returned: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

export const RequestListView: React.FC<RequestListViewProps> = ({
  requests,
  onStatusChange,
}) => {
  const [devices, setDevices] = useState<Map<number, Equipment>>(new Map());
  const [users, setUsers] = useState<Map<number, User>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      const [devicesRes, usersRes] = await Promise.all([
        equipmentAPI.getAll(),
        usersAPI.getAll(),
      ]);

      if (devicesRes.success && devicesRes.data) {
        const deviceMap = new Map<number, Equipment>();
        devicesRes.data.forEach((d) => deviceMap.set(d.id, d));
        setDevices(deviceMap);
      }

      if (usersRes.success && usersRes.data) {
        const userMap = new Map<number, User>();
        usersRes.data.forEach((u) => userMap.set(u.id, u));
        setUsers(userMap);
      }
    };

    fetchData();
  }, []);

  const getDevice = (deviceId: string) => devices.get(parseInt(deviceId));
  const getUser = (userId: string) => users.get(parseInt(userId));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>Requester</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const device = getDevice(request.deviceId);
            const user = getUser(request.userId);

            return (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {device && (
                      <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={device.image_url}
                          alt={device.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {device?.name || "Loading..."}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {device?.asset_tag}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{user?.name || "Loading..."}</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{format(new Date(request.startDate), "MMM d, yyyy")}</p>
                    <p className="text-muted-foreground">
                      to {format(new Date(request.endDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm max-w-[200px] truncate">
                    {request.reason}
                  </p>
                </TableCell>
                <TableCell>
                  <Select
                    value={request.status}
                    onValueChange={(value) =>
                      onStatusChange(request.id, value as RequestStatus)
                    }
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue>
                        <Badge
                          variant="outline"
                          className={statusColors[request.status]}
                        >
                          {request.status}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          <Badge
                            variant="outline"
                            className={statusColors[status]}
                          >
                            {status}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(request.createdAt), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
