import React, { useState, useMemo, useEffect } from 'react';
import { UserNavbar } from '@/components/layout/UserNavbar';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { DeviceCard } from '@/components/devices/DeviceCard';
import { DeviceDetailModal } from '@/components/devices/DeviceDetailModal';
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
import { Search, Laptop, Smartphone, Tablet, Monitor as MonitorIcon, Headphones, LayoutGrid, List, Grid3X3, X, Heart, ArrowUpDown, SortAsc, SortDesc } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { useFavorites } from '@/hooks/use-favorites';
import { toast } from 'sonner';
import { SkeletonCard, SkeletonListItem } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';

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
  const [isLoading, setIsLoading] = useState(true);
  
  // Recently viewed tracking
  const { addToRecentlyViewed } = useRecentlyViewed();
  
  // Favorites
  const { favorites, toggleFavorite, isFavorite, favoritesCount } = useFavorites();

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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
    addToRecentlyViewed(device.id);
    setSelectedDevice(device);
    setModalOpen(true);
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

  return (
    <div className="min-h-screen bg-background" id="main-content" tabIndex={-1}>
      <UserNavbar />

      <div className="container px-4 md:px-6 pt-4">
        <BreadcrumbNav />
      </div>

      {/* Hero Section - Dashboard Style */}
      <section className="container px-4 md:px-6 py-8">
        <div className="flex items-center gap-2 mb-1">
          <Laptop className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {devices.filter(d => d.status === 'available').length} devices available
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Device Catalog
        </h1>
        <p className="text-muted-foreground">
          Browse and request equipment for your projects.
        </p>
      </section>

      {/* Filters - Solid Sticky Header */}
      <section className="border-b bg-background shadow-sm sticky top-16 z-40">
        <div className="container px-4 md:px-6 py-3">
          {/* Main Filter Row */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background/50"
              />
            </div>

            {/* Category Pills - Inline */}
            <div className="hidden md:flex items-center gap-1.5 px-1">
              {categoryOptions.map(option => (
                <Button
                  key={option.value}
                  variant={categoryFilter === option.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCategoryFilter(option.value)}
                  className={cn(
                    "h-8 px-3 text-xs font-medium gap-1.5 rounded-full transition-all",
                    categoryFilter === option.value 
                      ? "shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option.icon}
                  <span className="hidden lg:inline">{option.label}</span>
                </Button>
              ))}
            </div>

            {/* Mobile Category Dropdown */}
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as DeviceCategory | 'all')}>
              <SelectTrigger className="md:hidden w-[130px] h-9">
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

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-border" />

            {/* Compact Filters Group */}
            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DeviceStatus | 'all')}>
                <SelectTrigger className="w-[120px] h-9 text-xs">
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

              {/* Sort */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Sort" />
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
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-border" />

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Favorites Filter */}
              <Button
                variant={showFavoritesOnly ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={cn(
                  "h-8 px-2.5 gap-1.5 rounded-lg",
                  showFavoritesOnly && "shadow-sm"
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", showFavoritesOnly && "fill-current")} />
                {favoritesCount > 0 && (
                  <span className="text-xs font-medium">{favoritesCount}</span>
                )}
              </Button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(categoryFilter !== 'all' || statusFilter !== 'all' || searchQuery || showFavoritesOnly) && (
            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-dashed">
              <span className="text-xs text-muted-foreground">Active:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {searchQuery && (
                  <Badge variant="secondary" className="h-6 text-xs gap-1 pl-2 pr-1">
                    "{searchQuery}"
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setSearchQuery('')}
                    />
                  </Badge>
                )}
                {categoryFilter !== 'all' && (
                  <Badge variant="secondary" className="h-6 text-xs gap-1 pl-2 pr-1">
                    {categoryOptions.find(c => c.value === categoryFilter)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setCategoryFilter('all')}
                    />
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="h-6 text-xs gap-1 pl-2 pr-1">
                    {statusOptions.find(s => s.value === statusFilter)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setStatusFilter('all')}
                    />
                  </Badge>
                )}
                {showFavoritesOnly && (
                  <Badge variant="secondary" className="h-6 text-xs gap-1 pl-2 pr-1">
                    Favorites only
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setShowFavoritesOnly(false)}
                    />
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setShowFavoritesOnly(false);
                  }}
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
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

        {isLoading ? (
          // Loading Skeletons
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonListItem key={i} />
              ))}
            </div>
          )
        ) : filteredAndSortedDevices.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedDevices.map(device => (
                <div key={device.id} className="relative animate-fade-in">
                  <DeviceCard 
                    device={device} 
                    onClick={handleDeviceClick}
                    onQuickRequest={handleQuickRequest}
                    onFavoriteToggle={handleFavoriteToggle}
                    isFavorite={isFavorite(device.id)}
                    showQuickRequest={true}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedDevices.map(device => (
                <div 
                  key={device.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-md animate-fade-in"
                  onClick={() => handleDeviceClick(device)}
                >
                  {/* Favorite button for list view */}
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
                  {device.status === 'available' && (
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
          <EmptyState
            type={showFavoritesOnly ? 'no-favorites' : 'no-results'}
            actionLabel={showFavoritesOnly ? 'View all devices' : undefined}
            onAction={showFavoritesOnly ? () => setShowFavoritesOnly(false) : undefined}
          />
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
