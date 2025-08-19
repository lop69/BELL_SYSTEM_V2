import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Wifi, WifiOff, MoreVertical, Edit, Trash2, Tag, HardDrive, Calendar as CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Schedule } from "@/types/database";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";

interface Device {
  id: string;
  device_name: string;
  is_connected: boolean;
  last_seen: string;
  schedule_id: string;
  schedules: { name: string } | null;
}

const Devices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const devicesPromise = supabase.from("devices").select("*, schedules(name)").eq("user_id", user.id);
    const schedulesPromise = supabase.from("schedules").select("*").eq("user_id", user.id);

    const [{ data: devicesData, error: devicesError }, { data: schedulesData, error: schedulesError }] = await Promise.all([devicesPromise, schedulesPromise]);

    if (devicesError || schedulesError) {
      showError("Failed to fetch data.");
    } else {
      setDevices(devicesData as any[] || []);
      setSchedules(schedulesData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('realtime-devices').on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, fetchData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleDeleteDevice = async (deviceId: string) => {
    const toastId = showLoading("Deleting device...");
    const { error } = await supabase.from("devices").delete().eq("id", deviceId);
    dismissToast(toastId);
    if (error) showError("Failed to delete device.");
    else showSuccess("Device deleted.");
  };

  const handleUpdateDevice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDevice) return;

    const formData = new FormData(e.currentTarget);
    const device_name = formData.get("deviceName") as string;
    const schedule_id = formData.get("schedule") as string;

    const toastId = showLoading("Updating device...");
    const { error } = await supabase.from("devices").update({ device_name, schedule_id }).eq("id", editingDevice.id);
    
    dismissToast(toastId);
    if (error) {
      showError("Failed to update device.");
    } else {
      showSuccess("Device updated successfully!");
      setIsEditDialogOpen(false);
      setEditingDevice(null);
    }
  };

  const openEditDialog = (device: Device) => {
    setEditingDevice(device);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-10 w-32" /></div>
        <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Your Devices</h1><p className="text-muted-foreground">Manage your connected hardware.</p></div>
        <Button className="gradient-button" onClick={() => navigate("/app/add-device")}><Plus className="mr-2 h-4 w-4" /> Add Device</Button>
      </div>

      {devices.length > 0 ? (
        <div className="space-y-4">
          {devices.map((device) => (
            <Card key={device.id} className="glass-card">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {device.is_connected ? <Wifi className="h-8 w-8 text-green-500" /> : <WifiOff className="h-8 w-8 text-red-500" />}
                  <div>
                    <p className="font-semibold">{device.device_name}</p>
                    <p className="text-sm text-muted-foreground">Assigned to: {device.schedules?.name || "Unassigned"}</p>
                    <p className="text-xs text-muted-foreground">Last seen: {device.last_seen ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true }) : "Never"}</p>
                  </div>
                </div>
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => openEditDialog(device)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem><DropdownMenuItem onClick={() => handleDeleteDevice(device.id)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card text-center p-8"><CardHeader><CardTitle className="flex justify-center items-center gap-3"><HardDrive className="h-8 w-8 text-primary" />No Devices Found</CardTitle><CardDescription>You haven't set up any hardware yet.</CardDescription></CardHeader><CardContent><Button onClick={() => navigate("/app/add-device")}><Plus className="mr-2 h-4 w-4" /> Add Your First Device</Button></CardContent></Card>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}><DialogContent className="sm:max-w-md glass-card"><DialogHeader><DialogTitle>Edit Device</DialogTitle><DialogDescription>Change the device name or re-assign its schedule.</DialogDescription></DialogHeader><form onSubmit={handleUpdateDevice} className="space-y-4 pt-4"><div><Label htmlFor="deviceName">Device Name</Label><div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="deviceName" name="deviceName" defaultValue={editingDevice?.device_name} className="pl-10" required /></div></div><div><Label htmlFor="schedule">Assign to Schedule</Label><div className="relative"><CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Select name="schedule" required defaultValue={editingDevice?.schedule_id}><SelectTrigger className="pl-10"><SelectValue placeholder="Select a schedule..." /></SelectTrigger><SelectContent>{schedules.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div></div><DialogFooter><Button type="submit" className="gradient-button">Save Changes</Button></DialogFooter></form></DialogContent></Dialog>
    </div>
  );
};

export default Devices;