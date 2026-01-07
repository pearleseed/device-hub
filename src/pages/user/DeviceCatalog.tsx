import React, { useState, useMemo } from 'react';
import { UserNavbar } from '@/components/layout/UserNavbar';
import { DeviceCard } from '@/components/devices/DeviceCard';
import { DeviceDetailModal } from '@/components/devices/DeviceDetailModal';
import { DeviceComparisonModal } from '@/components/devices/DeviceComparisonModal';
import { devices, Device, DeviceCategory, DeviceStatus } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Search, Laptop, Smartphone, Tablet, Monitor as MonitorIcon, Headphones, LayoutGrid, GitCompare, List, Grid3X3, X } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Comparison feature
  const [compareMode, setCompareMode] = useState(false);
  const [compareDevices, setCompareDevices] = useState<Device[]>([]);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);

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
    if (compareMode) {
      toggleCompareDevice(device);
    } else {
      setSelectedDevice(device);
      setModalOpen(true);
    }
  };

  const toggleCompareDevice = (device: Device) => {
    setCompareDevices(prev => {
      const exists = prev.some(d => d.id === device.id);
      if (exists) {
        return prev.filter(d => d.id !== device.id);
      }
      if (prev.length >= 3) {
        return prev; // Max 3 devices
      }
      return [...prev, device];
    });
  };

  const isDeviceSelected = (deviceId: string) => {
    return compareDevices.some(d => d.id === deviceId);
  };

  const handleCompare = () => {
    if (compareDevices.length >= 2) {
      setComparisonModalOpen(true);
    }
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setCompareDevices([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar onSearch={setSearchQuery} />

      {/* Compare Mode Banner */}
      {compareMode && (
        <div className="sticky top-16 z-40 bg-primary text-primary-foreground py-3 px-4 shadow-md">
          <div className="container flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GitCompare className="h-5 w-5" />
              <span className="font-medium">
                Compare Mode: Select up to 3 devices ({compareDevices.length}/3 selected)
              </span>
              {compareDevices.length > 0 && (
                <div className="flex gap-2">
                  {compareDevices.map(device => (
                    <Badge 
                      key={device.id} 
                      variant="secondary"
                      className="bg-primary-foreground/20 text-primary-foreground gap-1"
                    >
                      {device.name}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompareDevice(device);
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleCompare}
                disabled={compareDevices.length < 2}
              >
                Compare ({compareDevices.length})
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={exitCompareMode}
                className="text-primary-foreground hover:text-primary-foreground/80"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

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
      <section className={cn("border-b bg-card sticky z-40", compareMode ? "top-28" : "top-16")}>
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

            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Compare Mode Toggle */}
            {!compareMode && (
              <Button
                variant="outline"
                onClick={() => setCompareMode(true)}
                className="gap-2"
              >
                <GitCompare className="h-4 w-4" />
                Compare
              </Button>
            )}
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

      {/* Device Grid/List */}
      <section className="container px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredDevices.length}</span> devices
          </p>
        </div>

        {filteredDevices.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDevices.map(device => (
                <div key={device.id} className="relative">
                  {compareMode && (
                    <div 
                      className={cn(
                        "absolute top-3 right-3 z-10 h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors",
                        isDeviceSelected(device.id) 
                          ? "bg-primary border-primary text-primary-foreground" 
                          : "bg-card border-muted-foreground/30 hover:border-primary"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompareDevice(device);
                      }}
                    >
                      {isDeviceSelected(device.id) && (
                        <span className="text-xs font-bold">
                          {compareDevices.findIndex(d => d.id === device.id) + 1}
                        </span>
                      )}
                    </div>
                  )}
                  <DeviceCard 
                    device={device} 
                    onClick={handleDeviceClick}
                    className={cn(
                      compareMode && isDeviceSelected(device.id) && "ring-2 ring-primary"
                    )}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDevices.map(device => (
                <div 
                  key={device.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-md",
                    compareMode && isDeviceSelected(device.id) && "ring-2 ring-primary"
                  )}
                  onClick={() => handleDeviceClick(device)}
                >
                  {compareMode && (
                    <div 
                      className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        isDeviceSelected(device.id) 
                          ? "bg-primary border-primary text-primary-foreground" 
                          : "bg-card border-muted-foreground/30"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompareDevice(device);
                      }}
                    >
                      {isDeviceSelected(device.id) && (
                        <span className="text-xs font-bold">
                          {compareDevices.findIndex(d => d.id === device.id) + 1}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={device.image} alt={device.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{device.name}</h3>
                    <p className="text-sm text-muted-foreground">{device.brand} • {device.model}</p>
                  </div>
                  <div className="hidden sm:block text-sm text-muted-foreground capitalize">
                    {device.category}
                  </div>
                  <div className="hidden md:flex gap-2">
                    {device.specs.ram && (
                      <Badge variant="secondary">{device.specs.ram}</Badge>
                    )}
                    {device.specs.storage && (
                      <Badge variant="secondary">{device.specs.storage}</Badge>
                    )}
                  </div>
                  <Badge variant={device.status === 'available' ? 'default' : 'secondary'}>
                    {device.status}
                  </Badge>
                </div>
              ))}
            </div>
          )
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

      {/* Device Comparison Modal */}
      <DeviceComparisonModal
        devices={compareDevices}
        open={comparisonModalOpen}
        onOpenChange={setComparisonModalOpen}
        onRemoveDevice={(deviceId) => {
          setCompareDevices(prev => prev.filter(d => d.id !== deviceId));
          if (compareDevices.length <= 2) {
            setComparisonModalOpen(false);
          }
        }}
      />
    </div>
  );
};

export default DeviceCatalog;
