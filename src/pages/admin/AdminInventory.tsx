import React, { useState } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { devices as initialDevices, Device, getUserById } from '@/lib/mockData';
import { exportToCSV, deviceExportColumns } from '@/lib/exportUtils';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, QrCode, Download } from 'lucide-react';
import { AddDeviceModal } from '@/components/admin/AddDeviceModal';
import { EditDeviceModal } from '@/components/admin/EditDeviceModal';
import { useToast } from '@/hooks/use-toast';

const AdminInventory: React.FC = () => {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDevice = (newDevice: Omit<Device, 'id'>) => {
    const device: Device = {
      ...newDevice,
      id: String(devices.length + 1),
    };
    setDevices([...devices, device]);
    toast({ title: 'Device added', description: `${device.name} has been added to inventory.` });
  };

  const handleEditDevice = (updatedDevice: Device) => {
    setDevices(devices.map(d => d.id === updatedDevice.id ? updatedDevice : d));
    toast({ title: 'Device updated', description: `${updatedDevice.name} has been updated.` });
  };

  const handleDeleteDevice = (device: Device) => {
    setDevices(devices.filter(d => d.id !== device.id));
    toast({ title: 'Device deleted', description: `${device.name} has been removed.`, variant: 'destructive' });
  };

  const openEditModal = (device: Device) => {
    setSelectedDevice(device);
    setEditModalOpen(true);
  };

  const handleExportCSV = () => {
    exportToCSV(devices, 'device_inventory', deviceExportColumns);
    toast({ title: 'Export complete', description: 'Device inventory has been downloaded as CSV.' });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">Manage all devices in your inventory</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Devices ({filteredDevices.length})</CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map(device => {
                  const assignedUser = device.assignedTo ? getUserById(device.assignedTo) : null;
                  return (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                            <img src={device.image} alt={device.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-medium">{device.name}</p>
                            <p className="text-sm text-muted-foreground">{device.brand}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{device.assetTag}</TableCell>
                      <TableCell className="capitalize">{device.category}</TableCell>
                      <TableCell><StatusBadge status={device.status} /></TableCell>
                      <TableCell>{assignedUser?.name || '—'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(device)}>
                              <Pencil className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem><QrCode className="mr-2 h-4 w-4" />Generate QR</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteDevice(device)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AddDeviceModal open={addModalOpen} onOpenChange={setAddModalOpen} onAdd={handleAddDevice} />
        <EditDeviceModal open={editModalOpen} onOpenChange={setEditModalOpen} device={selectedDevice} onSave={handleEditDevice} />
      </main>
    </div>
  );
};

export default AdminInventory;
