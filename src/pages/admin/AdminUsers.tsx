import React, { useState } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { users as initialUsers, User, UserRole, getRequestsByUser } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, MoreHorizontal, Pencil, Trash2, Mail, Shield, ShieldCheck, Undo2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminUsers: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', department: '', role: 'user' as UserRole });

  const handleAddUser = () => {
    const user: User = {
      id: String(users.length + 1),
      ...newUser,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face`,
    };
    setUsers([...users, user]);
    setNewUser({ name: '', email: '', department: '', role: 'user' });
    setAddModalOpen(false);
    toast({ title: 'User added', description: `${user.name} has been added.` });
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
    setEditModalOpen(false);
    toast({ title: 'User updated', description: `${selectedUser.name} has been updated.` });
  };

  const handleDeleteUser = (user: User) => {
    const deletedUser = user;
    setUsers(users.filter(u => u.id !== user.id));
    
    toast({ 
      title: 'User deleted', 
      description: `${user.name} has been removed.`,
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setUsers(prev => [...prev, deletedUser]);
            toast({ title: 'Restored', description: `${deletedUser.name} has been restored.` });
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
    setUsers(users.filter(u => !selectedUsers.some(s => s.id === u.id)));
    setSelectedUsers([]);
    
    toast({ 
      title: 'Users deleted', 
      description: `${deletedUsers.length} users have been removed.`,
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setUsers(prev => [...prev, ...deletedUsers]);
            toast({ title: 'Restored', description: `${deletedUsers.length} users have been restored.` });
          }}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Undo
        </Button>
      ),
    });
  };

  const getActiveLoansCount = (userId: string) => {
    return getRequestsByUser(userId).filter(r => r.status === 'active').length;
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: t('common.name'),
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: t('common.email'),
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {user.email}
        </div>
      ),
    },
    {
      key: 'department',
      header: t('common.department'),
      sortable: true,
    },
    {
      key: 'role',
      header: t('common.role'),
      sortable: true,
      render: (user) => (
        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
          {user.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
          {user.role === 'admin' ? t('users.admin') : t('users.user')}
        </Badge>
      ),
    },
    {
      key: 'activeLoans',
      header: t('users.activeLoans'),
      render: (user) => (
        <Badge variant="outline">{getActiveLoansCount(user.id)}</Badge>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'w-[70px]',
      render: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setSelectedUser(user); setEditModalOpen(true); }}>
              <Pencil className="mr-2 h-4 w-4" />{t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />{t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main id="main-content" className="flex-1 p-8" tabIndex={-1} role="main" aria-label="User management">
        <BreadcrumbNav />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('users.title')}</h1>
            <p className="text-muted-foreground">{t('users.subtitle')}</p>
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
              {t('users.addUser')}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('users.allUsers')} ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={users}
              columns={columns}
              getRowId={(user) => user.id}
              searchable
              searchPlaceholder={`${t('common.search')}...`}
              searchKeys={['name', 'email', 'department']}
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
          <DialogContent>
            <DialogHeader><DialogTitle>{t('users.addUser')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('common.name')}</Label>
                <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t('common.email')}</Label>
                <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t('common.department')}</Label>
                <Input value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t('common.role')}</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{t('users.user')}</SelectItem>
                    <SelectItem value="admin">{t('users.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleAddUser}>{t('common.add')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('common.edit')} {selectedUser?.name}</DialogTitle></DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('common.name')}</Label>
                  <Input value={selectedUser.name} onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.email')}</Label>
                  <Input type="email" value={selectedUser.email} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.department')}</Label>
                  <Input value={selectedUser.department} onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.role')}</Label>
                  <Select value={selectedUser.role} onValueChange={(v) => setSelectedUser({ ...selectedUser, role: v as UserRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t('users.user')}</SelectItem>
                      <SelectItem value="admin">{t('users.admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleEditUser}>{t('common.save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminUsers;
