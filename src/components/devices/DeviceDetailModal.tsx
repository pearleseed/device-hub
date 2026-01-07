import React, { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Device, getUserById, devices } from '@/lib/mockData';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarIcon, Cpu, HardDrive, Battery, Monitor, CheckCircle2, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { DateRange } from 'react-day-picker';

interface DeviceDetailModalProps {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ModalStep = 'details' | 'confirm' | 'success';

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<ModalStep>('details');

  if (!device) return null;

  const assignedUser = device.assignedTo ? getUserById(device.assignedTo) : null;

  // Get similar devices (same category, available, excluding current)
  const similarDevices = devices
    .filter(d => d.category === device.category && d.id !== device.id && d.status === 'available')
    .slice(0, 3);

  const handleProceedToConfirm = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: 'Please select dates',
        description: 'Both start and end dates are required.',
        variant: 'destructive',
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: 'Please provide a reason',
        description: 'A reason for the request is required.',
        variant: 'destructive',
      });
      return;
    }

    setStep('confirm');
  };

  const handleConfirmRequest = () => {
    setStep('success');
  };

  const handleClose = () => {
    // Reset form and close modal
    setDateRange(undefined);
    setReason('');
    setStep('details');
    onOpenChange(false);
  };

  const handleQuickDateSelect = (days: number) => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + days);
    setDateRange({ from, to });
  };

  const specItems = [
    { icon: Cpu, label: 'Processor', value: device.specs.processor },
    { icon: HardDrive, label: 'Storage', value: device.specs.storage },
    { icon: Monitor, label: 'Display', value: device.specs.display },
    { icon: Battery, label: 'Battery', value: device.specs.battery },
  ].filter(item => item.value);

  const loanDuration = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : 0;

  // Success Step
  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 animate-fade-in">Request Submitted!</h2>
            <p className="text-muted-foreground mb-6 animate-fade-in">
              Your request for <span className="font-medium text-foreground">{device.name}</span> has been sent for approval.
            </p>
            
            <div className="bg-muted rounded-lg p-4 mb-6 text-left animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span>Estimated approval time</span>
              </div>
              <p className="font-medium">1-2 business days</p>
            </div>

            <div className="space-y-3 animate-fade-in">
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full">
                View My Requests
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Confirmation Step
  if (step === 'confirm') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Request</DialogTitle>
            <DialogDescription>
              Please review the details before submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Device Info */}
            <div className="flex gap-4 p-4 bg-muted rounded-lg">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-background flex-shrink-0">
                <img
                  src={device.image}
                  alt={device.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-medium">{device.name}</h4>
                <p className="text-sm text-muted-foreground">{device.brand} • {device.model}</p>
                <p className="text-sm text-muted-foreground">{device.assetTag}</p>
              </div>
            </div>

            {/* Date Range */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Loan Period</span>
              </div>
              <p className="font-medium">
                {dateRange?.from && format(dateRange.from, 'MMM d, yyyy')} – {dateRange?.to && format(dateRange.to, 'MMM d, yyyy')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {loanDuration} day{loanDuration !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Reason */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Reason</p>
              <p className="text-sm">{reason}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('details')} className="flex-1">
              Back
            </Button>
            <Button onClick={handleConfirmRequest} className="flex-1">
              <Sparkles className="h-4 w-4 mr-2" />
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Details Step (default)
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{device.name}</DialogTitle>
              <DialogDescription>{device.brand} • {device.model}</DialogDescription>
            </div>
            <StatusBadge status={device.status} />
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Image */}
          <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
            <img
              src={device.image}
              alt={device.name}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Asset Tag */}
            <div>
              <p className="text-sm text-muted-foreground">Asset Tag</p>
              <p className="font-mono text-lg">{device.assetTag}</p>
            </div>

            {/* Specs */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Specifications</p>
              {device.specs.os && (
                <div className="flex items-center gap-2 bg-secondary rounded-lg p-3">
                  <span className="text-sm font-medium">Operating System:</span>
                  <span className="text-sm text-muted-foreground">{device.specs.os}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {specItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 bg-secondary rounded-lg p-3">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Assignment */}
            {assignedUser && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Currently assigned to</p>
                <p className="font-medium">{assignedUser.name}</p>
                <p className="text-sm text-muted-foreground">{assignedUser.department}</p>
              </div>
            )}
          </div>
        </div>

        {/* Booking Section */}
        {device.status === 'available' && (
          <div className="border-t pt-6 mt-6 space-y-4">
            <h4 className="font-semibold">Request this Device</h4>
            
            {/* Quick Date Presets */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground mr-2">Quick select:</span>
              <Button variant="outline" size="sm" onClick={() => handleQuickDateSelect(7)}>
                1 Week
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDateSelect(14)}>
                2 Weeks
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDateSelect(30)}>
                1 Month
              </Button>
            </div>

            {/* Date Range Picker */}
            <div className="space-y-2">
              <Label>Select Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} – {format(dateRange.to, "MMM d, yyyy")}
                          {loanDuration > 0 && (
                            <Badge variant="secondary" className="ml-auto">
                              {loanDuration} day{loanDuration !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Select start and end dates</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    disabled={(date) => date < new Date()}
                    numberOfMonths={2}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Request</Label>
              <Textarea
                id="reason"
                placeholder="Please describe why you need this device..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleProceedToConfirm} className="w-full">
              Review Request
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {device.status !== 'available' && (
          <div className="border-t pt-6 mt-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                This device is currently {device.status === 'borrowed' ? 'borrowed' : 'under maintenance'}.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back later or browse other available devices.
              </p>
            </div>
          </div>
        )}

        {/* Similar Devices Section */}
        {similarDevices.length > 0 && (
          <div className="border-t pt-6 mt-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Also Available
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {similarDevices.map(similarDevice => (
                <div 
                  key={similarDevice.id} 
                  className="p-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer group"
                >
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted mb-2">
                    <img
                      src={similarDevice.image}
                      alt={similarDevice.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h5 className="font-medium text-sm truncate">{similarDevice.name}</h5>
                  <p className="text-xs text-muted-foreground truncate">{similarDevice.brand}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    Available
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
