import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Search } from "lucide-react";
import { useUsers, useDevices } from "@/hooks/use-api-queries";
import { useCreateBorrowRequest } from "@/hooks/use-api-mutations";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const createRequestSchema = z.object({
  user_id: z.number().min(1, "Please select a user"),
  device_id: z.number().min(1, "Please select a device"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  reason: z.string().min(1, "Reason is required").max(500),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

type CreateRequestFormData = z.infer<typeof createRequestSchema>;

interface CreateRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [userSearch, setUserSearch] = useState("");
  const [deviceSearch, setDeviceSearch] = useState("");

  const { data: users = [] } = useUsers();
  const { data: devices = [] } = useDevices();
  const createRequest = useCreateBorrowRequest();

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<CreateRequestFormData>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      user_id: 0,
      device_id: 0,
      start_date: today,
      end_date: "",
      reason: "",
    },
  });

  // Filter active users
  const activeUsers = useMemo(() => {
    return users.filter((u) => u.is_active);
  }, [users]);

  // Filter available devices
  const availableDevices = useMemo(() => {
    return devices.filter((d) => d.status === "available");
  }, [devices]);

  // Search filtered users
  const filteredUsers = useMemo(() => {
    if (!userSearch) return activeUsers;
    const search = userSearch.toLowerCase();
    return activeUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
    );
  }, [activeUsers, userSearch]);

  // Search filtered devices
  const filteredDevices = useMemo(() => {
    if (!deviceSearch) return availableDevices;
    const search = deviceSearch.toLowerCase();
    return availableDevices.filter(
      (d) =>
        d.name.toLowerCase().includes(search) ||
        d.asset_tag.toLowerCase().includes(search) ||
        d.brand.toLowerCase().includes(search)
    );
  }, [availableDevices, deviceSearch]);

  const userId = form.watch("user_id");
  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === userId);
  }, [users, userId]);

  const deviceId = form.watch("device_id");
  const selectedDevice = useMemo(() => {
    return devices.find((d) => d.id === deviceId);
  }, [devices, deviceId]);

  const startDate = form.watch("start_date");

  const onSubmit = async (data: CreateRequestFormData) => {
    try {
      await createRequest.mutateAsync({
        device_id: data.device_id,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason,
        user_id: data.user_id, // Admin creating on behalf of user
      });

      toast({
        title: t("requests.requestCreated") || "Request Created",
        description: t("requests.requestCreatedDesc") || "Borrow request has been created successfully.",
        variant: "default",
      });

      form.reset();
      setUserSearch("");
      setDeviceSearch("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create request";
      toast({
        title: t("common.error") || "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    form.reset();
    setUserSearch("");
    setDeviceSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("requests.createRequest") || "Create Borrow Request"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* User Selection */}
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("requests.selectUser") || "Select User"} *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("requests.selectUserPlaceholder") || "Choose a user..."}>
                          {selectedUser && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={selectedUser.avatar_url || undefined} />
                                <AvatarFallback className="text-[10px]">
                                  {selectedUser.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{selectedUser.name}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="p-2 sticky top-0 bg-background">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={t("common.search") || "Search..."}
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="pl-8 h-9"
                          />
                        </div>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {filteredUsers.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground text-sm">
                            {t("common.noResults") || "No users found"}
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.avatar_url || undefined} />
                                  <AvatarFallback className="text-[10px]">
                                    {user.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium">{user.name}</span>
                                  <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Device Selection */}
            <FormField
              control={form.control}
              name="device_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("requests.selectDevice") || "Select Device"} *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("requests.selectDevicePlaceholder") || "Choose a device..."}>
                          {selectedDevice && (
                            <div className="flex items-center gap-2">
                              <span className="truncate">{selectedDevice.name}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {selectedDevice.asset_tag}
                              </Badge>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="p-2 sticky top-0 bg-background">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={t("common.search") || "Search..."}
                            value={deviceSearch}
                            onChange={(e) => setDeviceSearch(e.target.value)}
                            className="pl-8 h-9"
                          />
                        </div>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {filteredDevices.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground text-sm">
                            {t("requests.noAvailableDevices") || "No available devices"}
                          </div>
                        ) : (
                          filteredDevices.map((device) => (
                            <SelectItem key={device.id} value={device.id.toString()}>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                  <span className="font-medium">{device.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {device.brand} • {device.asset_tag}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("requests.startDate") || "Start Date"} *</FormLabel>
                    <FormControl>
                      <Input type="date" min={today} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("requests.endDate") || "End Date"} *</FormLabel>
                    <FormControl>
                      <Input type="date" min={startDate || today} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("requests.reason") || "Reason"} *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("requests.reasonPlaceholder") || "Enter the reason for this request..."}
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button type="submit" disabled={createRequest.isPending}>
                {createRequest.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.creating") || "Creating..."}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("requests.createRequest") || "Create Request"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
