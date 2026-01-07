import React, { useState } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, LayoutList, ChevronDown, Filter } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { bookingRequests, devices, DeviceCategory } from '@/lib/mockData';
import { DeviceCalendarView } from '@/components/calendar/DeviceCalendarView';
import { DeviceTimelineView } from '@/components/calendar/DeviceTimelineView';
import { AvailabilitySummary } from '@/components/calendar/AvailabilitySummary';
import { useToast } from '@/hooks/use-toast';

const categories: { value: DeviceCategory; labelKey: string }[] = [
  { value: 'laptop', labelKey: 'Laptops' },
  { value: 'mobile', labelKey: 'Mobile Devices' },
  { value: 'tablet', labelKey: 'Tablets' },
  { value: 'monitor', labelKey: 'Monitors' },
  { value: 'accessories', labelKey: 'Accessories' },
];

const AdminCalendar: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<'calendar' | 'timeline'>('calendar');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(true);

  // Filter devices by selected categories
  const filteredDevices = selectedCategories.length > 0
    ? devices.filter(d => selectedCategories.includes(d.category))
    : devices;

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    // Reset device selection when category changes
    setSelectedDevices([]);
  };

  const handleDeviceToggle = (deviceId: string) => {
    setSelectedDevices(prev =>
      prev.includes(deviceId)
        ? prev.filter(d => d !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleSelectAllDevices = () => {
    if (selectedDevices.length === filteredDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredDevices.map(d => d.id));
    }
  };

  const handleApprove = (id: string) => {
    toast({
      title: t('requests.approved'),
      description: `Request ${id} has been approved.`,
    });
  };

  const handleReject = (id: string) => {
    toast({
      title: t('requests.rejected'),
      description: `Request ${id} has been rejected.`,
      variant: 'destructive',
    });
  };

  return (
    <div className="flex min-h-screen bg-background w-full">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="flex-1 p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{t('calendar.title')}</h1>
              <p className="text-muted-foreground">{t('calendar.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={activeView === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('calendar')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t('calendar.calendarView')}
              </Button>
              <Button
                variant={activeView === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('timeline')}
              >
                <LayoutList className="h-4 w-4 mr-2" />
                {t('calendar.timelineView')}
              </Button>
            </div>
          </div>

          {/* Summary */}
          <AvailabilitySummary />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <Card className="lg:col-span-1">
              <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span className="font-medium">{t('calendar.filters')}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {/* Categories */}
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">{t('calendar.categories')}</Label>
                      <div className="space-y-2">
                        {categories.map(category => (
                          <div key={category.value} className="flex items-center gap-2">
                            <Checkbox
                              id={`cat-${category.value}`}
                              checked={selectedCategories.includes(category.value)}
                              onCheckedChange={() => handleCategoryToggle(category.value)}
                            />
                            <Label htmlFor={`cat-${category.value}`} className="text-sm cursor-pointer">
                              {category.labelKey}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Devices */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">{t('calendar.devices')}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto py-1 px-2 text-xs"
                          onClick={handleSelectAllDevices}
                        >
                          {selectedDevices.length === filteredDevices.length
                            ? t('common.deselectAll')
                            : t('common.selectAll')}
                        </Button>
                      </div>
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-2">
                          {filteredDevices.map(device => (
                            <div key={device.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`device-${device.id}`}
                                checked={selectedDevices.includes(device.id)}
                                onCheckedChange={() => handleDeviceToggle(device.id)}
                              />
                              <Label htmlFor={`device-${device.id}`} className="text-sm cursor-pointer">
                                {device.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeView === 'calendar' ? (
                <DeviceCalendarView
                  bookings={bookingRequests}
                  selectedDevices={selectedDevices}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ) : (
                <DeviceTimelineView
                  bookings={bookingRequests}
                  selectedDevices={selectedDevices}
                  selectedCategories={selectedCategories}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminCalendar;
