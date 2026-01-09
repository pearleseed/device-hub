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
import type { User, UserRole } from "@/lib/mockData";
import { getRequestsByUser } from "@/lib/mockData";
import { useUsers, useRefreshData } from "@/hooks/use-data-cache";
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
import { format } from "date-fns";

const AdminUsers: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // Use cached data
  const { data: cachedUsers = [], isLoading } = useUsers();
  const { refreshUsers } = useRefreshData();
  
  // Local state for optimistic updates
  const [localUsers, setLocalUsers] = useState<User[] | null>(null);
  const users = localUsers ?? cachedUsers;
  const setUsers = (updater: User[] | ((prev: User[]) => User[])) => {
    if (typeof updater === 'function') {
      setLocalUsers(updater(users));
    } else {
      setLocalUsers(updater);
    }
  };
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
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

  const handleToggleUserActive = (userId: string, isActive: boolean) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive } : u)),
    );
  };

  const handleResetPassword = (userId: string, _newPassword: string) => {
    // In a real app, this would call the API
    toast({
      title: "Password Reset",
      description: "Password has been reset successfully.",
    });
  };

  const handleSaveUser = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
    );
    setSelectedUser(updatedUser);
  };

  const openDetailModal = (user: User) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };

  const handleAddUser = () => {
    if (!newUser.password || newUser.password.length < 6) {
      toast({ 
        title: "Password required", 
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }
    const user: User = {
      id: String(users.length + 1),
      name: newUser.name,
      email: newUser.email,
      department: newUser.department,
      role: newUser.role,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face`,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setUsers([...users, user]);
    setNewUser({ name: "", email: "", department: "", role: "user", password: "" });
    setAddModalOpen(false);
    toast({ title: "User added", description: `${user.name} has been added.` });
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
      title: "User updated",
      description: `${selectedUser.name} has been updated.${editPassword ? " Password has been changed." : ""}`,
    });
  };

  const handleDeleteUser = (user: User) => {
    const deletedUser = user;
    setUsers(users.filter((u) => u.id !== user.id));

    toast({
      title: "User deleted",
      description: `${user.name} has been removed.`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setUsers((prev) => [...prev, deletedUser]);
            toast({
              title: "Restored",
              description: `${deletedUser.name} has been restored.`,
            });
          }}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Undo
        </Button>
      ),
    });
  };

  const handleBulkDelete = () => {
    const deletedUsers = [...selectedUsers];
    setUsers(users.filter((u) => !selectedUsers.some((s) => s.id === u.id)));
    setSelectedUsers([]);

    toast({
      title: "Users deleted",
      description: `${deletedUsers.length} users have been removed.`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setUsers((prev) => [...prev, ...deletedUsers]);
            toast({
              title: "Restored",
              description: `${deletedUsers.length} users have been restored.`,
            });
          }}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Undo
        </Button>
      ),
    });
  };

  const getActiveLoansCount = (userId: string) => {
    return getRequestsByUser(userId).filter((r) => r.status === "active")
      .length;
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

  const columns: Column<User>[] = [
    {
      key: "name",
      header: t("common.name"),
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {!user.isActive && (
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
    },
    {
      key: "role",
      header: t("common.role"),
      sortable: true,
      render: (user) => (
        <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
          {getRoleIcon(user.role)}
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (user) => (
        <Badge
          variant={user.isActive ? "outline" : "destructive"}
          className="gap-1"
        >
          {user.isActive ? (
            <>
              <Unlock className="h-3 w-3" />
              Active
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" />
              Locked
            </>
          )}
        </Badge>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.lastLoginAt
            ? format(new Date(user.lastLoginAt), "MMM d, h:mm a")
            : "Never"}
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
              View Details
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
            {isSuperuser && user.id !== currentUser?.id && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleToggleUserActive(user.id, !user.isActive)}
                >
                  {user.isActive ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Lock Account
                    </>
                  ) : (
                    <>
                      <Unlock className="mr-2 h-4 w-4" />
                      Unlock Account
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
                Delete ({selectedUsers.length})
              </Button>
            )}
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
              getRowId={(user) => user.id}
              searchable
              searchPlaceholder={`${t("common.search")}...`}
              searchKeys={["name", "email", "department"]}
              paginated
              pageSize={10}
              selectable
              onSelectionChange={setSelectedUsers}
              emptyMessage="No users found"
              emptyDescription="Add your first user to get started"
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
                  Password
                </Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="Min. 6 characters"
                />
                <p className="text-xs text-muted-foreground">
                  Set the initial password for this user
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t("common.department")}</Label>
                <Input
                  value={newUser.department}
                  onChange={(e) =>
                    setNewUser({ ...newUser, department: e.target.value })
                  }
                />
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
                    <SelectItem value="admin">{t("users.admin")}</SelectItem>
                  </SelectContent>
                </Select>
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
        <Dialog open={editModalOpen} onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditPassword("");
        }}>
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
                    value={selectedUser.department}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        department: e.target.value,
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
                    disabled={!isSuperuser}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t("users.user")}</SelectItem>
                      <SelectItem value="admin">{t("users.admin")}</SelectItem>
                      {isSuperuser && (
                        <SelectItem value="superuser">Superuser</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Password Adjustment Section */}
                {isSuperuser && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Change Password
                    </Label>
                    <Input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Leave empty to keep current password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a new password (min. 6 characters) or leave empty to keep the current one
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditModalOpen(false);
                setEditPassword("");
              }}>
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
          currentUserId={currentUser?.id || ""}
        />
      </main>
    </div>
  );
};

export default AdminUsers;
