import React, { useState, useMemo } from 'react';
import { UserNavbar } from '@/components/layout/UserNavbar';
import { DeviceCard } from '@/components/devices/DeviceCard';
import { DeviceDetailModal } from '@/components/devices/DeviceDetailModal';
import { DeviceComparisonModal } from '@/components/devices/DeviceComparisonModal';
import { devices, Device, DeviceCategory, DeviceStatus } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Search, Laptop, Smartphone, Tablet, Monitor as MonitorIcon, Headphones, LayoutGrid, GitCompare, List, Grid3X3, X, Heart, ArrowUpDown, SortAsc, SortDesc } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { useFavorites } from '@/hooks/use-favorites';
import { toast } from 'sonner';

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

type SortOption = 'name-asc' | 'name-desc' | 'newest' | 'availability' | 'favorites';

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'name-asc', label: 'Name (A-Z)', icon: <SortAsc className="h-4 w-4" /> },
  { value: 'name-desc', label: 'Name (Z-A)', icon: <SortDesc className="h-4 w-4" /> },
  { value: 'newest', label: 'Newest First', icon: <ArrowUpDown className="h-4 w-4" /> },
  { value: 'availability', label: 'Available First', icon: <ArrowUpDown className="h-4 w-4" /> },
  { value: 'favorites', label: 'Favorites First', icon: <Heart className="h-4 w-4" /> },
];

const DeviceCatalog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DeviceCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Comparison feature
  const [compareMode, setCompareMode] = useState(false);
  const [compareDevices, setCompareDevices] = useState<Device[]>([]);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  
  // Recently viewed tracking
  const { addToRecentlyViewed } = useRecentlyViewed();
  
  // Favorites
  const { favorites, toggleFavorite, isFavorite, favoritesCount } = useFavorites();

  const filteredAndSortedDevices = useMemo(() => {
    let result = devices.filter(device => {
      const matchesSearch = 
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || device.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
      const matchesFavorites = !showFavoritesOnly || favorites.includes(device.id);

      return matchesSearch && matchesCategory && matchesStatus && matchesFavorites;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'newest':
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        case 'availability':
          const statusOrder = { available: 0, borrowed: 1, maintenance: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'favorites':
          const aFav = favorites.includes(a.id) ? 0 : 1;
          const bFav = favorites.includes(b.id) ? 0 : 1;
          return aFav - bFav;
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, categoryFilter, statusFilter, sortBy, showFavoritesOnly, favorites]);

  const handleDeviceClick = (device: Device) => {
    if (compareMode) {
      toggleCompareDevice(device);
    } else {
      addToRecentlyViewed(device.id);
      setSelectedDevice(device);
      setModalOpen(true);
    }
  };

  const handleQuickRequest = (device: Device) => {
    addToRecentlyViewed(device.id);
    setSelectedDevice(device);
    setModalOpen(true);
    toast.info('Quick Request', {
      description: `Opening request form for ${device.name}`,
    });
  };

  const handleFavoriteToggle = (deviceId: string) => {
    const wasAdded = !isFavorite(deviceId);
    toggleFavorite(deviceId);
    
    const device = devices.find(d => d.id === deviceId);
    toast.success(wasAdded ? 'Added to favorites' : 'Removed from favorites', {
      description: device?.name,
    });
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
    <div className="min-h-screen bg-background" id="main-content" tabIndex={-1}>
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

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
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

            {/* Favorites Filter */}
            <Button
              variant={showFavoritesOnly ? 'default' : 'outline'}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="gap-2"
            >
              <Heart className={cn("h-4 w-4", showFavoritesOnly && "fill-current")} />
              {favoritesCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {favoritesCount}
                </Badge>
              )}
            </Button>

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
            Showing <span className="font-medium text-foreground">{filteredAndSortedDevices.length}</span> devices
            {showFavoritesOnly && ' (favorites only)'}
          </p>
        </div>

        {filteredAndSortedDevices.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedDevices.map(device => (
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
                    onQuickRequest={handleQuickRequest}
                    onFavoriteToggle={!compareMode ? handleFavoriteToggle : undefined}
                    isFavorite={isFavorite(device.id)}
                    showQuickRequest={!compareMode}
                    className={cn(
                      compareMode && isDeviceSelected(device.id) && "ring-2 ring-primary"
                    )}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedDevices.map(device => (
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
                  
                  {/* Favorite button for list view */}
                  {!compareMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteToggle(device.id);
                      }}
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                        "hover:bg-muted",
                        isFavorite(device.id) && "text-red-500"
                      )}
                      aria-label={isFavorite(device.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={cn("h-4 w-4", isFavorite(device.id) && "fill-current")} />
                    </button>
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
                  
                  {/* Quick Request for list view */}
                  {!compareMode && device.status === 'available' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickRequest(device);
                      }}
                      className="hidden lg:flex gap-1"
                    >
                      Quick Request
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              {showFavoritesOnly ? <Heart className="h-8 w-8 text-muted-foreground" /> : <Search className="h-8 w-8 text-muted-foreground" />}
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {showFavoritesOnly ? 'No favorites yet' : 'No devices found'}
            </h3>
            <p className="text-muted-foreground">
              {showFavoritesOnly 
                ? 'Click the heart icon on any device to add it to your favorites.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {showFavoritesOnly && (
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => setShowFavoritesOnly(false)}
              >
                View all devices
              </Button>
            )}
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
