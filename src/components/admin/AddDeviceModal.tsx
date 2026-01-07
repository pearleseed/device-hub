import React, { useState } from 'react';
import { Device, DeviceCategory, DeviceStatus } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface AddDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (device: Omit<Device, 'id'>) => void;
}

const categories: DeviceCategory[] = ['laptop', 'mobile', 'tablet', 'monitor', 'accessories'];

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ open, onOpenChange, onAdd }) => {
  const [form, setForm] = useState({
    name: '',
    brand: '',
    model: '',
    category: 'laptop' as DeviceCategory,
    assetTag: '',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
    os: '',
    processor: '',
    ram: '',
    storage: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: form.name,
      brand: form.brand,
      model: form.model,
      category: form.category,
      assetTag: form.assetTag,
      status: 'available',
      assignedTo: null,
      image: form.image,
      specs: { os: form.os, processor: form.processor, ram: form.ram, storage: form.storage },
      addedDate: new Date().toISOString().split('T')[0],
    });
    setForm({ name: '', brand: '', model: '', category: 'laptop', assetTag: '', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop', os: '', processor: '', ram: '', storage: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add New Device</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Device Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Asset Tag</Label>
              <Input value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} placeholder="LAP-001" required />
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
              <Label>Image URL</Label>
              <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>OS</Label><Input value={form.os} onChange={(e) => setForm({ ...form, os: e.target.value })} /></div>
            <div className="space-y-2"><Label>Processor</Label><Input value={form.processor} onChange={(e) => setForm({ ...form, processor: e.target.value })} /></div>
            <div className="space-y-2"><Label>RAM</Label><Input value={form.ram} onChange={(e) => setForm({ ...form, ram: e.target.value })} /></div>
            <div className="space-y-2"><Label>Storage</Label><Input value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add Device</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
