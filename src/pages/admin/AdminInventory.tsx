import React, { useState } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable, Column } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { devices as initialDevices, Device, getUserById } from '@/lib/mockData';
import { exportToCSV, deviceExportColumns } from '@/lib/exportUtils';
import { Plus, MoreHorizontal, Pencil, Trash2, QrCode, Download, Undo2 } from 'lucide-react';
import { AddDeviceModal } from '@/components/admin/AddDeviceModal';
import { EditDeviceModal } from '@/components/admin/EditDeviceModal';
import { useToast } from '@/hooks/use-toast';

const AdminInventory: React.FC = () => {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedDevices, setSelectedDevices] = useState<Device[]>([]);

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
    const deletedDevice = device;
    setDevices(devices.filter(d => d.id !== device.id));
    
    toast({ 
      title: 'Device deleted', 
      description: `${device.name} has been removed.`,
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setDevices(prev => [...prev, deletedDevice]);
            toast({ title: 'Restored', description: `${deletedDevice.name} has been restored.` });
          }}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Undo
        </Button>
      ),
    });
  };

  const handleBulkDelete = () => {
    const deletedDevices = [...selectedDevices];
    setDevices(devices.filter(d => !selectedDevices.some(s => s.id === d.id)));
    setSelectedDevices([]);
    
    toast({ 
      title: 'Devices deleted', 
      description: `${deletedDevices.length} devices have been removed.`,
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setDevices(prev => [...prev, ...deletedDevices]);
            toast({ title: 'Restored', description: `${deletedDevices.length} devices have been restored.` });
          }}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Undo
        </Button>
      ),
    });
  };

  const openEditModal = (device: Device) => {
    setSelectedDevice(device);
    setEditModalOpen(true);
  };

  const handleExportCSV = () => {
    exportToCSV(devices, 'device_inventory', deviceExportColumns);
    toast({ title: 'Export complete', description: 'Device inventory has been downloaded as CSV.' });
  };

  const columns: Column<Device>[] = [
    {
      key: 'name',
      header: 'Device',
      sortable: true,
      render: (device) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
            <img src={device.image} alt={device.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-medium">{device.name}</p>
            <p className="text-sm text-muted-foreground">{device.brand}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'assetTag',
      header: 'Asset Tag',
      sortable: true,
      render: (device) => <span className="font-mono">{device.assetTag}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (device) => <span className="capitalize">{device.category}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (device) => <StatusBadge status={device.status} />,
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (device) => {
        const assignedUser = device.assignedTo ? getUserById(device.assignedTo) : null;
        return assignedUser?.name || '—';
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-[70px]',
      render: (device) => (
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
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main id="main-content" className="flex-1 p-8" tabIndex={-1} role="main" aria-label="Inventory management">
        <BreadcrumbNav />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">Manage all devices in your inventory</p>
          </div>
          <div className="flex gap-2">
            {selectedDevices.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedDevices.length})
              </Button>
            )}
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
            <CardTitle>All Devices ({devices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={devices}
              columns={columns}
              getRowId={(device) => device.id}
              searchable
              searchPlaceholder="Search devices..."
              searchKeys={['name', 'assetTag', 'brand', 'category']}
              paginated
              pageSize={10}
              selectable
              onSelectionChange={setSelectedDevices}
              emptyMessage="No devices found"
              emptyDescription="Add your first device to get started"
            />
          </CardContent>
        </Card>

        <AddDeviceModal open={addModalOpen} onOpenChange={setAddModalOpen} onAdd={handleAddDevice} />
        <EditDeviceModal open={editModalOpen} onOpenChange={setEditModalOpen} device={selectedDevice} onSave={handleEditDevice} />
      </main>
    </div>
  );
};

export default AdminInventory;
