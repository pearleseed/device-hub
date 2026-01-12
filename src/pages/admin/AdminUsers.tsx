import React, { useState } from "react";
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
  useDepartmentNames,
} from "@/hooks/use-api-queries";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Shield,
  ShieldCheck,
  Crown,
  Undo2,
  Eye,
  Lock,
  Unlock,
  Key,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserDetailModal } from "@/components/admin/UserDetailModal";
import { UserImportExport } from "@/components/admin/UserImportExport";
import { format } from "date-fns";

const AdminUsers: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Fetch department names from API
  const { data: departments = [] } = useDepartmentNames();

  // Use API queries directly
  const { data: cachedUsers = [] } = useUsers();
  const { data: bookingRequests = [] } = useBorrowRequests();
  const { refreshUsers } = useRefreshData();

  // Local state for optimistic updates
  const [localUsers, setLocalUsers] = useState<UserPublic[] | null>(null);
  const users = localUsers ?? cachedUsers;
  const setUsers = (
    updater: UserPublic[] | ((prev: UserPublic[]) => UserPublic[]),
  ) => {
    if (typeof updater === "function") {
      setLocalUsers(updater(users));
    } else {
      setLocalUsers(updater);
    }
  };
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserPublic | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<UserPublic[]>([]);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    department: "",
    role: "user" as UserRole,
    password: "",
  });
  const [editPassword, setEditPassword] = useState("");

  const currentUserRole = currentUser?.role || "user";
  const isSuperuser = currentUserRole === "superuser";
  const isAdmin = currentUserRole === "admin";
  const canManageUsers = isSuperuser || isAdmin; // Admin và Superuser đều có thể quản lý users

  const handleToggleUserActive = (userId: number, isActive: boolean) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: isActive } : u)),
    );
  };

  const handleResetPassword = (_userId: number, _newPassword: string) => {
    // In a real app, this would call the API
    toast({
      title: t("users.passwordResetTitle"),
      description: t("users.passwordResetDesc"),
    });
  };

  const handleSaveUser = (updatedUser: UserPublic) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
    );
    setSelectedUser(updatedUser);
  };

  const openDetailModal = (user: UserPublic) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };

  const handleAddUser = () => {
    if (!newUser.password || newUser.password.length < 6) {
      toast({
        title: t("users.passwordRequiredTitle"),
        description: t("users.passwordRequiredDesc"),
        variant: "destructive",
      });
      return;
    }
    const user: UserPublic = {
      id: users.length + 1,
      name: newUser.name,
      email: newUser.email,
      department_id: 1,
      department_name: newUser.department,
      role: newUser.role,
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face`,
      avatar_thumbnail_url: null,
      is_active: true,
      last_login_at: null,
      created_at: new Date(),
    };
    setUsers([...users, user]);
    setNewUser({
      name: "",
      email: "",
      department: "",
      role: "user",
      password: "",
    });
    setAddModalOpen(false);
    toast({
      title: t("users.userAddedTitle"),
      description: `${user.name} ${t("inventory.hasBeenAdded")} `,
    });
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    setUsers(users.map((u) => (u.id === selectedUser.id ? selectedUser : u)));

    // Handle password update if provided
    if (editPassword && editPassword.length >= 6) {
      handleResetPassword(selectedUser.id, editPassword);
    }

    setEditModalOpen(false);
    setEditPassword("");
    toast({
      title: t("users.userUpdatedTitle"),
      description: `${selectedUser.name} ${t("inventory.hasBeenUpdated")}.${editPassword ? ` ${t("users.passwordChanged")}` : ""}`,
    });
  };

  const handleDeleteUser = (user: UserPublic) => {
    const deletedUser = user;
    setUsers(users.filter((u) => u.id !== user.id));

    toast({
      title: t("users.userDeletedTitle"),
      description: `${user.name} ${t("inventory.hasBeenRemoved")}.`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setUsers((prev) => [...prev, deletedUser]);
            toast({
              title: t("common.restored"),
              description: `${deletedUser.name} ${t("inventory.hasBeenRestored")}.`,
            });
          }}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          {t("common.undo")}
        </Button>
      ),
    });
  };

  const handleBulkDelete = () => {
    const deletedUsers = [...selectedUsers];
    setUsers(users.filter((u) => !selectedUsers.some((s) => s.id === u.id)));
    setSelectedUsers([]);

    toast({
      title: t("users.usersDeletedTitle"),
      description: `${deletedUsers.length} ${t("inventory.haveBeenRemoved")}.`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setUsers((prev) => [...prev, ...deletedUsers]);
            toast({
              title: t("common.restored"),
              description: `${deletedUsers.length} ${t("inventory.haveBeenRestored")}.`,
            });
          }}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          {t("common.undo")}
        </Button>
      ),
    });
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
        className="flex-1 p-8"
        tabIndex={-1}
        role="main"
        aria-label="User management"
      >
        <BreadcrumbNav />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t("users.title")}</h1>
            <p className="text-muted-foreground">{t("users.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            {selectedUsers.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("common.delete")} ({selectedUsers.length})
              </Button>
            )}
            <UserImportExport onImportComplete={refreshUsers} />
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("users.addUser")}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("users.allUsers")} ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={users}
              columns={columns}
              getRowId={(user) => String(user.id)}
              searchable
              searchPlaceholder={`${t("common.search")}...`}
              searchKeys={["name", "email", "department_name"]}
              paginated
              pageSize={10}
              selectable
              onSelectionChange={setSelectedUsers}
              emptyMessage={t("table.noData")}
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
                  type="email"
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
                  value={newUser.department}
                  onValueChange={(v) =>
                    setNewUser({ ...newUser, department: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("users.selectDepartment")} />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
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
              <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleAddUser}>{t("common.add")}</Button>
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
                    type="email"
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
