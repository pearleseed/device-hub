import React, { useState, useMemo } from 'react';
import { UserNavbar } from '@/components/layout/UserNavbar';
import { DeviceCard } from '@/components/devices/DeviceCard';
import { DeviceDetailModal } from '@/components/devices/DeviceDetailModal';
import { devices, Device, DeviceCategory, DeviceStatus } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Laptop, Smartphone, Tablet, Monitor as MonitorIcon, Headphones, LayoutGrid } from 'lucide-react';

const categoryOptions: { value: DeviceCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Categories', icon: <LayoutGrid className="h-4 w-4" /> },
  { value: 'laptop', label: 'Laptops', icon: <Laptop className="h-4 w-4" /> },
  { value: 'mobile', label: 'Mobile', icon: <Smartphone className="h-4 w-4" /> },
  { value: 'tablet', label: 'Tablets', icon: <Tablet className="h-4 w-4" /> },
  { value: 'monitor', label: 'Monitors', icon: <MonitorIcon className="h-4 w-4" /> },
  { value: 'accessories', label: 'Accessories', icon: <Headphones className="h-4 w-4" /> },
];

const statusOptions: { value: DeviceStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'available', label: 'Available' },
  { value: 'borrowed', label: 'Borrowed' },
  { value: 'maintenance', label: 'Maintenance' },
];

const DeviceCatalog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DeviceCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchesSearch = 
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || device.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || device.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, categoryFilter, statusFilter]);

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar onSearch={setSearchQuery} />

      {/* Hero Section */}
      <section className="border-b bg-card">
        <div className="container px-4 md:px-6 py-12 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Find the equipment you need
            </h1>
            <p className="text-lg text-muted-foreground">
              Browse our catalog of available devices. Request what you need for your projects.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b bg-card sticky top-16 z-40">
        <div className="container px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, brand, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as DeviceCategory | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(option => (
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
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DeviceStatus | 'all')}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {categoryOptions.map(option => (
              <Button
                key={option.value}
                variant={categoryFilter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(option.value)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                {option.icon}
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Device Grid */}
      <section className="container px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredDevices.length}</span> devices
          </p>
        </div>

        {filteredDevices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDevices.map(device => (
              <DeviceCard 
                key={device.id} 
                device={device} 
                onClick={handleDeviceClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No devices found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </section>

      {/* Device Detail Modal */}
      <DeviceDetailModal 
        device={selectedDevice}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default DeviceCatalog;
