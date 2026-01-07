import React, { useState } from 'react';
import { format } from 'date-fns';
import { Device, getUserById } from '@/lib/mockData';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarIcon, X, Cpu, HardDrive, Battery, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DeviceDetailModalProps {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState('');

  if (!device) return null;

  const assignedUser = device.assignedTo ? getUserById(device.assignedTo) : null;

  const handleRequest = () => {
    if (!startDate || !endDate) {
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

    toast({
      title: 'Request submitted!',
      description: `Your request for ${device.name} has been sent for approval.`,
    });

    // Reset form and close modal
    setStartDate(undefined);
    setEndDate(undefined);
    setReason('');
    onOpenChange(false);
  };

  const specItems = [
    { icon: Cpu, label: 'Processor', value: device.specs.processor },
    { icon: HardDrive, label: 'Storage', value: device.specs.storage },
    { icon: Monitor, label: 'Display', value: device.specs.display },
    { icon: Battery, label: 'Battery', value: device.specs.battery },
  ].filter(item => item.value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < (startDate || new Date())}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
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

            <Button onClick={handleRequest} className="w-full">
              Submit Request
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
      </DialogContent>
    </Dialog>
  );
};
