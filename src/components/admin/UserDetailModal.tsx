import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UserPublic, UserRole } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Mail,
  Building,
  Shield,
  ShieldCheck,
  Crown,
  Calendar,
  Clock,
  Lock,
  Unlock,
  Key,
  AlertTriangle,
  Copy,
  Check,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDepartmentNames } from "@/hooks/use-api-queries";

const userEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().min(3, "Invalid username format"),
  department: z.string().min(1, "Department is required"),
  role: z.enum(["superuser", "admin", "user"]),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

interface UserDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserPublic | null;
  onSave: (user: UserPublic) => void;
  onToggleActive: (userId: number, isActive: boolean) => void;
  onResetPassword: (userId: number, newPassword: string) => void;
  currentUserRole: UserRole;
  currentUserId: number;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  open,
  onOpenChange,
  user,
  onSave,
  onToggleActive,
  onResetPassword,
  currentUserRole,
  currentUserId,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Fetch department names from API
  const { data: departments = [] } = useDepartmentNames();

  const isSuperuser = currentUserRole === "superuser";
  const isAdmin = currentUserRole === "admin";
  const canManageUsers = isSuperuser || isAdmin;
  const isOwnProfile = user?.id === currentUserId;
  // Admin không thể quản lý superuser
  const canManageThisUser =
    canManageUsers && (isSuperuser || user?.role !== "superuser");

  const form = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      role: "user",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        department: user.department_name || "",
        role: user.role,
      });
    }
  }, [user, form]);

  const handleSave = (data: UserEditFormData) => {
    if (!user) return;

    onSave({
      ...user,
      name: data.name,
      email: data.email,
      department_name: data.department,
      role: data.role as UserRole,
    });
    setIsEditing(false);
    toast({
      title: t("toast.userUpdated"),
      description: t("toast.userUpdatedDesc", { name: data.name }),
    });
  };

  const handleToggleActive = () => {
    if (!user) return;
    onToggleActive(user.id, !user.is_active);
    toast({
      title: user.is_active
        ? t("toast.accountLocked")
        : t("toast.accountUnlocked"),
      description: user.is_active
        ? t("toast.accountLockedDesc", { name: user.name })
        : t("toast.accountUnlockedDesc", { name: user.name }),
    });
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setShowPassword(true);
  };

  const handleResetPassword = () => {
    if (!user || !newPassword) return;
    onResetPassword(user.id, newPassword);
    toast({
      title: t("toast.passwordReset"),
      description: t("toast.passwordResetDesc", { name: user.name }),
    });
    setShowPassword(false);
    setNewPassword("");
  };

  const copyPassword = async () => {
    await navigator.clipboard.writeText(newPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "superuser":
        return <Crown className="h-4 w-4" />;
      case "admin":
        return <ShieldCheck className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "superuser":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setActiveTab("details");
    setNewPassword("");
    setShowPassword(false);
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <div className="p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border shadow-sm">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {user.name}
                  {!user.is_active && (
                    <Badge
                      variant="destructive"
                      className="gap-1 px-1.5 py-0 text-[10px] h-4 uppercase font-bold"
                    >
                      <Lock className="h-2.5 w-2.5" />
                      {t("adminUsers.locked")}
                    </Badge>
                  )}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge
                  variant={getRoleBadgeVariant(user.role)}
                  className="mt-1 gap-1"
                >
                  {getRoleIcon(user.role)}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">
                {t("adminUsers.details")}
              </TabsTrigger>
              <TabsTrigger value="security">
                {t("adminUsers.security")}
              </TabsTrigger>
              <TabsTrigger value="activity">
                {t("adminUsers.activity")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              {isEditing ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSave)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("common.name")}</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-9" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("common.email")}</FormLabel>
                            <FormControl>
                              <Input type="text" {...field} className="h-9" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("common.department")}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("common.role")}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!canManageThisUser || isOwnProfile}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user">
                                  {t("users.user")}
                                </SelectItem>
                                {canManageUsers && (
                                  <SelectItem value="admin">
                                    {t("users.admin")}
                                  </SelectItem>
                                )}
                                {isSuperuser && (
                                  <SelectItem value="superuser">
                                    {t("adminUsers.superuser")}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button type="submit" size="sm">
                        {t("deviceModal.saveChanges")}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("common.email")}</p>
                        <p className="text-sm font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t("common.department")}
                        </p>
                        <p className="text-sm font-medium">
                          {user.department_name}
                        </p>
                      </div>
                    </div>
                  </div>
                  {canManageThisUser && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      {t("adminUsers.editUserInfo")}
                    </Button>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user.is_active ? (
                      <Unlock className="h-5 w-5 text-green-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {t("adminUsers.accountStatus")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.is_active
                          ? t("adminUsers.accountActiveDesc")
                          : t("adminUsers.accountLockedDesc")}
                      </p>
                    </div>
                  </div>
                  {canManageThisUser && !isOwnProfile && (
                    <Button
                      variant={user.is_active ? "destructive" : "default"}
                      size="sm"
                      onClick={handleToggleActive}
                    >
                      {user.is_active ? (
                        <>
                          <Lock className="h-3.5 w-3.5 mr-1.5" />
                          {t("adminUsers.lockAccount")}
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3.5 w-3.5 mr-1.5" />
                          {t("adminUsers.unlockAccount")}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {canManageThisUser && (
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {t("adminUsers.passwordManagement")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("adminUsers.passwordManagementDesc")}
                      </p>
                    </div>
                  </div>

                  {showPassword ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyPassword}
                        >
                          {passwordCopied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{t("adminUsers.passwordShareWarning")}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generatePassword}
                        >
                          {t("adminUsers.regenerate")}
                        </Button>
                        <Button size="sm" onClick={handleResetPassword}>
                          {t("adminUsers.applyPassword")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowPassword(false);
                            setNewPassword("");
                          }}
                        >
                          {t("common.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={generatePassword}
                    >
                      <Key className="h-3.5 w-3.5 mr-2" />
                      {t("adminUsers.generateNewPassword")}
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("adminUsers.lastLogin")}
                    </p>
                    <p className="text-sm font-medium">
                      {user.last_login_at
                        ? format(
                            new Date(user.last_login_at),
                            "MMM d, yyyy 'at' h:mm a",
                          )
                        : t("adminUsers.never")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("adminUsers.accountCreated")}
                    </p>
                    <p className="text-sm font-medium">
                      {user.created_at
                        ? format(new Date(user.created_at), "MMM d, yyyy")
                        : t("common.unknown")}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm mb-2">
                  {t("adminDashboard.recentActivity")}
                </h4>
                <p className="text-xs text-muted-foreground text-center py-6 bg-muted/30 rounded-lg border border-dashed">
                  {t("adminUsers.activityTrackingSoon")}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="bg-muted/50 p-4 border-t">
          <Button variant="outline" size="sm" onClick={handleClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
