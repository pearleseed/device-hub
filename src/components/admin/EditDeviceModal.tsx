import React, { useState, useEffect } from 'react';
import { Device, DeviceCategory, DeviceStatus } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface EditDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
  onSave: (device: Device) => void;
}

const categories: DeviceCategory[] = ['laptop', 'mobile', 'tablet', 'monitor', 'accessories'];
const statuses: DeviceStatus[] = ['available', 'borrowed', 'maintenance'];

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({ open, onOpenChange, device, onSave }) => {
  const [form, setForm] = useState<Device | null>(null);

  useEffect(() => {
    if (device) setForm({ ...device });
  }, [device]);

  if (!form) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Device</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Device Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Asset Tag</Label>
              <Input value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as DeviceCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as DeviceStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>OS</Label><Input value={form.specs.os || ''} onChange={(e) => setForm({ ...form, specs: { ...form.specs, os: e.target.value } })} /></div>
            <div className="space-y-2"><Label>Processor</Label><Input value={form.specs.processor || ''} onChange={(e) => setForm({ ...form, specs: { ...form.specs, processor: e.target.value } })} /></div>
            <div className="space-y-2"><Label>RAM</Label><Input value={form.specs.ram || ''} onChange={(e) => setForm({ ...form, specs: { ...form.specs, ram: e.target.value } })} /></div>
            <div className="space-y-2"><Label>Storage</Label><Input value={form.specs.storage || ''} onChange={(e) => setForm({ ...form, specs: { ...form.specs, storage: e.target.value } })} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
