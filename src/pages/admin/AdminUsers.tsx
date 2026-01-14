import React, { useState, useMemo } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Column } from "@/components/ui/data-table";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserPublic, UserRole } from "@/types/api";
import {
  useUsers,
  useRefreshData,
  useBorrowRequests,
  useDepartments,
} from "@/hooks/use-api-queries";
import {
  useUpdateUser,
  useToggleUserStatus,
  useDeleteUser,
  useResetUserPassword,
  useCreateUser,
  useBulkCreateDepartments,
} from "@/hooks/use-api-mutations";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  Eye,
  Lock,
  Unlock,
  Key,
  Building2,
  X,
  Crown,
  ShieldCheck,
  Shield,
  Mail,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserDetailModal } from "@/components/admin/UserDetailModal";
import { UserImportExport } from "@/components/admin/UserImportExport";
import { format } from "date-fns";

const AdminUsers: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Fetch departments from API
  const { data: departments = [] } = useDepartments();

  // Use API queries directly
  const { data: users = [] } = useUsers();
  const { data: bookingRequests = [] } = useBorrowRequests();
  const { refreshUsers } = useRefreshData();

  // Mutation hooks
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const toggleUserStatus = useToggleUserStatus();
  const deleteUser = useDeleteUser();
  const resetUserPassword = useResetUserPassword();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserPublic | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<UserPublic[]>([]);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    department_id: 0,
    role: "user" as UserRole,
    password: "",
  });
  const [editPassword, setEditPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Department creation state
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);
  const [newDepts, setNewDepts] = useState([{ name: "", code: "" }]);
  const bulkCreateDepartments = useBulkCreateDepartments();

  const handleAddDeptRow = () => {
    setNewDepts([...newDepts, { name: "", code: "" }]);
  };

  const handleRemoveDeptRow = (index: number) => {
    if (newDepts.length === 1) return;
    const updated = [...newDepts];
    updated.splice(index, 1);
    setNewDepts(updated);
  };

  const handleDeptChange = (index: number, field: "name" | "code", value: string) => {
    const updated = [...newDepts];
    updated[index][field] = value;
    setNewDepts(updated);
  };

  const handleCreateDepartments = async () => {
    // Basic validation
    const validDepts = newDepts.filter(d => d.name.trim() && d.code.trim());
    if (validDepts.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please enter at least one valid department with Name and Code",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await bulkCreateDepartments.mutateAsync(
        validDepts.map(d => ({
          name: d.name.trim(),
          code: d.code.trim().toUpperCase(),
        }))
      );
      setNewDepts([{ name: "", code: "" }]);
      setAddDeptModalOpen(false);
    } catch (error) {
      console.error("Failed to create departments:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentUserRole = currentUser?.role || "user";
  const isSuperuser = currentUserRole === "superuser";
  const isAdmin = currentUserRole === "admin";
  const canManageUsers = isSuperuser || isAdmin; // Admin và Superuser đều có thể quản lý users

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "locked">("all");

  // Get unique departments from users
  const departmentOptions = useMemo(() => {
    const deps = new Set<string>();
    users.forEach((user) => {
      if (user.department_name) deps.add(user.department_name);
    });
    return Array.from(deps).sort();
  }, [users]);

  const roleOptions = useMemo(
    () => [
      { value: "all", label: t("filter.all"), icon: <Shield className="h-4 w-4" /> },
      { value: "user", label: t("users.user"), icon: <Shield className="h-4 w-4" /> },
      { value: "admin", label: t("users.admin"), icon: <ShieldCheck className="h-4 w-4" /> },
      { value: "superuser", label: "Superuser", icon: <Crown className="h-4 w-4" /> },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("status.all") },
      { value: "active", label: t("users.statusActive") },
      { value: "locked", label: t("users.statusLocked") },
    ],
    [t]
  );

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.department_name?.toLowerCase().includes(query) ?? false);
        if (!matchesSearch) return false;
      }

      // Department filter
      if (departmentFilter !== "all" && user.department_name !== departmentFilter) {
        return false;
      }

      // Role filter
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "active" && !user.is_active) return false;
        if (statusFilter === "locked" && user.is_active) return false;
      }

      return true;
    });
  }, [users, searchQuery, departmentFilter, roleFilter, statusFilter]);

  const hasActiveFilters = !!(
    searchQuery ||
    departmentFilter !== "all" ||
    roleFilter !== "all" ||
    statusFilter !== "all"
  );

  const clearFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const handleToggleUserActive = async (userId: number, isActive: boolean) => {
    try {
      await toggleUserStatus.mutateAsync({ id: userId, is_active: isActive });
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      await resetUserPassword.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to reset password:", error);
    }
  };

  const handleSaveUser = async (updatedUser: UserPublic) => {
    try {
      await updateUser.mutateAsync({
        id: updatedUser.id,
        data: updatedUser,
      });
      setSelectedUser(updatedUser);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const openDetailModal = (user: UserPublic) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };

  const handleAddUser = async () => {
    if (!newUser.name?.trim()) {
      toast({
        title: t("users.nameRequiredTitle") || "Name Required",
        description: t("users.nameRequiredDesc") || "Please enter a name",
        variant: "destructive",
      });
      return;
    }
    if (!newUser.email?.trim()) {
      toast({
        title: t("users.emailRequiredTitle") || "Email Required",
        description: t("users.emailRequiredDesc") || "Please enter an email",
        variant: "destructive",
      });
      return;
    }
    if (!newUser.password || newUser.password.length < 6) {
      toast({
        title: t("users.passwordRequiredTitle"),
        description: t("users.passwordRequiredDesc"),
        variant: "destructive",
      });
      return;
    }
    if (!newUser.department_id) {
      toast({
        title: t("users.departmentRequiredTitle") || "Department Required",
        description: t("users.departmentRequiredDesc") || "Please select a department",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createUser.mutateAsync({
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        department_id: newUser.department_id,
        role: newUser.role,
      });

      setNewUser({
        name: "",
        email: "",
        department_id: 0,
        role: "user",
        password: "",
      });
      setAddModalOpen(false);
    } catch (error) {
      console.error("Failed to create user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    
    try {
      await updateUser.mutateAsync({
        id: selectedUser.id,
        data: selectedUser,
      });

      // Handle password update if provided
      if (editPassword && editPassword.length >= 6) {
        await handleResetPassword(selectedUser.id);
      }

      setEditModalOpen(false);
      setEditPassword("");
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: UserPublic) => {
    try {
      await deleteUser.mutateAsync(user.id);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleBulkDelete = async () => {
    setIsSubmitting(true);
    
    try {
      // Delete all selected users
      const promises = selectedUsers.map((user) =>
        deleteUser.mutateAsync(user.id)
      );
      
      await Promise.all(promises);
      setSelectedUsers([]);
    } catch (error) {
      console.error("Failed to delete users:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActiveLoansCount = (userId: number) => {
    return bookingRequests.filter(
      (r) => r.user_id === userId && r.status === "active",
    ).length;
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "superuser":
        return <Crown className="h-3 w-3" />;
      case "admin":
        return <ShieldCheck className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "superuser":
        return "default" as const;
      case "admin":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const columns: Column<UserPublic>[] = [
    {
      key: "name",
      header: t("common.name"),
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {!user.is_active && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center">
                <Lock className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          <span className="font-medium">{user.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: t("common.email"),
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{user.email}</span>
        </div>
      ),
    },
    {
      key: "department",
      header: t("common.department"),
      sortable: true,
      render: (user) => user.department_name || t("common.unknown"),
    },
    {
      key: "role",
      header: t("common.role"),
      sortable: true,
      render: (user) => (
        <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
          {getRoleIcon(user.role)}
          {t(`role.${user.role}`)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      sortable: true,
      render: (user) => (
        <Badge
          variant={user.is_active ? "outline" : "destructive"}
          className="gap-1"
        >
          {user.is_active ? (
            <>
              <Unlock className="h-3 w-3" />
              {t("users.statusActive")}
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" />
              {t("users.statusLocked")}
            </>
          )}
        </Badge>
      ),
    },
    {
      key: "lastLogin",
      header: t("userProfile.lastLoginLabel"),
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.last_login_at
            ? format(new Date(user.last_login_at), "MMM d, h:mm a")
            : t("common.na")}
        </span>
      ),
    },
    {
      key: "activeLoans",
      header: t("users.activeLoans"),
      render: (user) => (
        <Badge variant="outline">{getActiveLoansCount(user.id)}</Badge>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      className: "w-[70px]",
      render: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openDetailModal(user)}>
              <Eye className="mr-2 h-4 w-4" />
              {t("common.viewDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedUser(user);
                setEditModalOpen(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {t("common.edit")}
            </DropdownMenuItem>
            {canManageUsers &&
              user.id !== currentUser?.id &&
              (isSuperuser || user.role !== "superuser") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      handleToggleUserActive(user.id, !user.is_active)
                    }
                  >
                    {user.is_active ? (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        {t("users.statusLock")}
                      </>
                    ) : (
                      <>
                        <Unlock className="mr-2 h-4 w-4" />
                        {t("users.statusUnlock")}
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteUser(user)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("common.delete")}
                  </DropdownMenuItem>
                </>
              )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main
        id="main-content"
        className="flex-1 p-8 min-w-0 overflow-hidden"
        tabIndex={-1}
        role="main"
        aria-label="User management"
      >
        <BreadcrumbNav />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t("users.title")}</h1>
            {/* <p className="text-muted-foreground">{t("users.subtitle")}</p> */}
          </div>
          <div className="flex gap-2 py-2">
            {selectedUsers.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("common.delete")} ({selectedUsers.length})
              </Button>
            )}
            <UserImportExport onImportComplete={refreshUsers} />
            <Button variant="outline" onClick={() => setAddDeptModalOpen(true)}>
              <Building2 className="mr-2 h-4 w-4" />
              {t("common.add") + " Department"}
            </Button>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("users.addUser")}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("users.allUsers")} ({filteredUsers.length})
            </CardTitle>
          </CardHeader>

          {/* Filters */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={`${t("common.search")} ${t("users.title").toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Department Dropdown */}
              <Select
                value={departmentFilter}
                onValueChange={(v) => setDepartmentFilter(v)}
              >
                <SelectTrigger className="flex-1 min-w-[140px] max-w-[180px] h-9 text-sm">
                  <SelectValue placeholder={t("common.department")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.all")}</SelectItem>
                  {departmentOptions.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Role Dropdown */}
              <Select
                value={roleFilter}
                onValueChange={(v) => setRoleFilter(v as UserRole | "all")}
              >
                <SelectTrigger className="flex-1 min-w-[120px] max-w-[150px] h-9 text-sm">
                  <SelectValue placeholder={t("common.role")} />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as "all" | "active" | "locked")}
              >
                <SelectTrigger className="flex-1 min-w-[120px] max-w-[150px] h-9 text-sm">
                  <SelectValue placeholder={t("common.status")} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters - Only show when filters are applied */}
            {hasActiveFilters && (
              <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-dashed overflow-x-auto">
                <span className="text-xs text-muted-foreground shrink-0">
                  {t("deviceCatalog.filters")}:
                </span>
                {searchQuery && (
                  <Badge
                    variant="secondary"
                    className="h-6 text-xs gap-1 pl-2 pr-1 shrink-0"
                  >
                    "{searchQuery}"
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
                {departmentFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="h-6 text-xs gap-1 pl-2 pr-1 shrink-0"
                  >
                    {departmentFilter}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => setDepartmentFilter("all")}
                    />
                  </Badge>
                )}
                {roleFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="h-6 text-xs gap-1 pl-2 pr-1 shrink-0"
                  >
                    {roleOptions.find((r) => r.value === roleFilter)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => setRoleFilter("all")}
                    />
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="h-6 text-xs gap-1 pl-2 pr-1 shrink-0"
                  >
                    {statusOptions.find((s) => s.value === statusFilter)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => setStatusFilter("all")}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                  onClick={clearFilters}
                >
                  {t("deviceCatalog.clear")}
                </Button>
              </div>
            )}
          </div>

          <CardContent>
            <DataTable
              data={filteredUsers}
              columns={columns}
              getRowId={(user) => String(user.id)}
              paginated
              pageSize={10}
              selectable
              onSelectionChange={setSelectedUsers}
              emptyMessage={hasActiveFilters ? t("inventory.noMatchingDevices") : t("table.noData")}
              emptyDescription={t("inventory.addFirstDevice")}
            />
          </CardContent>
        </Card>

        {/* Add User Modal */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("users.addUser")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pb-2">
              <div className="space-y-2">
                <Label>{t("common.name")}</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.email")}</Label>
                <Input
                  type="text"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  {t("users.passwordLabel")}
                </Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder={t("users.passwordPlaceholder")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("users.passwordHelp")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t("common.department")}</Label>
                <Select
                  value={newUser.department_id ? String(newUser.department_id) : ""}
                  onValueChange={(v) =>
                    setNewUser({ ...newUser, department_id: parseInt(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("users.selectDepartment")} />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("common.role")}</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v) =>
                    setNewUser({ ...newUser, role: v as UserRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="user">{t("users.user")}</SelectItem>
                    {/* Admin và Superuser có thể tạo admin */}
                    {canManageUsers && (
                      <SelectItem value="admin">{t("users.admin")}</SelectItem>
                    )}
                    {/* Chỉ Superuser mới có thể tạo superuser */}
                    {isSuperuser && (
                      <SelectItem value="superuser">Superuser</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {!canManageUsers && (
                  <p className="text-xs text-muted-foreground">
                    {t("users.adminCreateHelp")}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddModalOpen(false)} disabled={isSubmitting}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleAddUser} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {t("common.adding") || "Adding..."}
                  </>
                ) : (
                  t("common.add")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Department Modal */}
        <Dialog open={addDeptModalOpen} onOpenChange={setAddDeptModalOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Departments</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 py-4 px-1">
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 font-medium text-xs uppercase text-muted-foreground px-1">
                  <div className="col-span-6">Name</div>
                  <div className="col-span-5">Code</div>
                </div>
                
                {newDepts.map((dept, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="col-span-6">
                      <Input
                        value={dept.name}
                        onChange={(e) => handleDeptChange(index, "name", e.target.value)}
                        placeholder="Department Name"
                        className="h-9"
                        autoFocus={index === newDepts.length - 1 && index > 0} 
                      />
                    </div>
                    <div className="col-span-5">
                      <Input
                        value={dept.code}
                        onChange={(e) => handleDeptChange(index, "code", e.target.value)}
                        placeholder="CODE"
                        className="uppercase h-9 font-mono"
                        maxLength={10}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center pt-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDeptRow(index)}
                        disabled={newDepts.length === 1}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddDeptRow} 
                    className="w-full border-dashed text-muted-foreground hover:text-foreground"
                >
                <Plus className="mr-2 h-3.5 w-3.5" /> Add Another Department
                </Button>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t mt-2">
              <Button
                variant="outline"
                onClick={() => setAddDeptModalOpen(false)}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleCreateDepartments} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    {t("common.add")} {newDepts.length > 1 ? `(${newDepts.length})` : ""}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog
          open={editModalOpen}
          onOpenChange={(open) => {
            setEditModalOpen(open);
            if (!open) setEditPassword("");
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("common.edit")} {selectedUser?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("common.name")}</Label>
                  <Input
                    value={selectedUser.name}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common.email")}</Label>
                  <Input
                    type="text"
                    value={selectedUser.email}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common.department")}</Label>
                  <Input
                    value={selectedUser.department_name || ""}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        department_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common.role")}</Label>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(v) =>
                      setSelectedUser({ ...selectedUser, role: v as UserRole })
                    }
                    disabled={
                      !canManageUsers ||
                      (isAdmin && selectedUser.role === "superuser")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t("users.user")}</SelectItem>
                      {canManageUsers && (
                        <SelectItem value="admin">
                          {t("users.admin")}
                        </SelectItem>
                      )}
                      {isSuperuser && (
                        <SelectItem value="superuser">Superuser</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {isAdmin && selectedUser.role === "superuser" && (
                    <p className="text-xs text-muted-foreground">
                      {t("users.superuserModifyHelp")}
                    </p>
                  )}
                </div>

                {canManageUsers &&
                  (isSuperuser || selectedUser.role !== "superuser") && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        {t("users.changePasswordLabel")}
                      </Label>
                      <Input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder={t("users.changePasswordPlaceholder")}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("users.changePasswordHelp")}
                      </p>
                    </div>
                  )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditPassword("");
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleEditUser}>{t("common.save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Detail Modal */}
        <UserDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          user={selectedUser}
          onSave={handleSaveUser}
          onToggleActive={handleToggleUserActive}
          onResetPassword={handleResetPassword}
          currentUserRole={currentUserRole as UserRole}
          currentUserId={currentUser?.id ?? 0}
        />
      </main>
    </div>
  );
};

export default AdminUsers;
