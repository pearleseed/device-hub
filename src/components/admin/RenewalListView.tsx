import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { RenewalRequestWithDetails, RenewalStatus } from "@/types/api";
import type { BorrowRequestWithDetails } from "@/types/api";
import { Check, X, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RenewalListViewProps {
  renewals: RenewalRequestWithDetails[];
  requests: BorrowRequestWithDetails[];
  onStatusChange: (id: number, status: RenewalStatus) => void;
}

export const RenewalListView: React.FC<RenewalListViewProps> = ({
  renewals,
  requests,
  onStatusChange,
}) => {
  const statusColors: Record<RenewalStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>Requester</TableHead>
            <TableHead>Extension</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {renewals.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                No renewal requests found
              </TableCell>
            </TableRow>
          ) : (
            renewals.map((renewal) => {
              const borrowRequest = requests.find(
                (r) => r.id === Number(renewal.borrow_request_id),
              );
              // Use data from the joined borrow request
              const deviceName = borrowRequest?.device_name || "Unknown Device";
              const deviceAssetTag = borrowRequest?.device_asset_tag || "N/A";
              const deviceImage =
                borrowRequest?.device_image || "/placeholder.svg";
              const userName = borrowRequest?.user_name || "Unknown User";

              return (
                <TableRow key={renewal.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                        <img
                          src={deviceImage}
                          alt={deviceName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {deviceName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {deviceAssetTag}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {userName}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <span>
                        {format(new Date(renewal.current_end_date), "MMM d")}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-primary">
                        {format(
                          new Date(renewal.requested_end_date),
                          "MMM d, yyyy",
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                      {renewal.reason}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[renewal.status]}
                    >
                      {renewal.status.charAt(0).toUpperCase() +
                        renewal.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(renewal.created_at), "MMM d, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {renewal.status === "pending" ? (
                      <div className="flex justify-end gap-1">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Approve Renewal
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Approve {userName}'s renewal request for{" "}
                                {deviceName}? The loan will be extended to{" "}
                                {format(
                                  new Date(renewal.requested_end_date),
                                  "MMM d, yyyy",
                                )}
                                .
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() =>
                                  onStatusChange(renewal.id, "approved")
                                }
                              >
                                Approve
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Reject Renewal
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Reject {userName}'s renewal request for{" "}
                                {deviceName}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() =>
                                  onStatusChange(renewal.id, "rejected")
                                }
                              >
                                Reject
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {renewal.reviewed_at
                          ? format(new Date(renewal.reviewed_at), "MMM d")
                          : "—"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
