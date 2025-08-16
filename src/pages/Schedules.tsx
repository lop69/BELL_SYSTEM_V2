import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthProvider";
import { Schedule, Bell } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Schedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [bells, setBells] = useState<{ [key: string]: Bell[] }>({});
  const [loading, setLoading] = useState(true);
  const [isAddBellDialogOpen, setIsAddBellDialogOpen] = useState(false);
  const [isAddScheduleDialogOpen, setIsAddScheduleDialogOpen] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState("");
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: schedulesData, error: schedulesError } = await supabase
        .from("schedules")
        .select("*")
        .order("created_at", { ascending: true });

      if (schedulesError) {
        showError("Failed to fetch schedules.");
        setLoading(false);
        return;
      }

      setSchedules(schedulesData || []);

      if (schedulesData && schedulesData.length > 0) {
        if (!activeTab) {
          setActiveTab(schedulesData[0].id);
        }
        const scheduleIds = schedulesData.map((s) => s.id);
        const { data: bellsData, error: bellsError } = await supabase
          .from("bells")
          .select("*")
          .in("schedule_id", scheduleIds)
          .order("time", { ascending: true });

        if (bellsError) {
          showError("Failed to fetch bells.");
        } else {
          const bellsBySchedule = (bellsData || []).reduce((acc, bell) => {
            (acc[bell.schedule_id] = acc[bell.schedule_id] || []).push(bell);
            return acc;
          }, {} as { [key: string]: Bell[] });
          setBells(bellsBySchedule);
        }
      }
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel("realtime-schedules")
      .on("postgres_changes", { event: "*", schema: "public" }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeTab]);

  const handleAddSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !newScheduleName.trim()) return;

    const toastId = showLoading("Creating schedule...");
    const { error } = await supabase.from("schedules").insert({ name: newScheduleName, user_id: user.id });
    dismissToast(toastId);

    if (error) {
      showError("Failed to create schedule.");
    } else {
      showSuccess("Schedule created!");
      setIsAddScheduleDialogOpen(false);
      setNewScheduleName("");
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    const toastId = showLoading("Deleting schedule...");
    const { error } = await supabase.from("schedules").delete().eq("id", scheduleId);
    dismissToast(toastId);
    if (error) {
      showError("Failed to delete schedule.");
    } else {
      showSuccess("Schedule deleted.");
      setActiveTab(schedules.length > 1 ? schedules.find(s => s.id !== scheduleId)?.id : undefined);
    }
  };

  const handleAddBell = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const formData = new FormData(event.currentTarget);
    const schedule_id = formData.get("schedule") as string;
    const time = formData.get("time") as string;
    const label = formData.get("label") as string;

    if (schedule_id && time && label) {
      const toastId = showLoading("Adding bell...");
      const { error } = await supabase.from("bells").insert({ schedule_id, time, label, user_id: user.id });
      dismissToast(toastId);
      if (error) {
        showError("Failed to add bell.");
      } else {
        showSuccess("Bell added successfully!");
        setIsAddBellDialogOpen(false);
      }
    }
  };

  const handleDeleteBell = async (bellId: string) => {
    const toastId = showLoading("Deleting bell...");
    const { error } = await supabase.from("bells").delete().eq("id", bellId);
    dismissToast(toastId);
    if (error) {
      showError("Failed to delete bell.");
    } else {
      showSuccess("Bell deleted.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center gap-2">
          <TabsList>
            {schedules.map((schedule) => (
              <TabsTrigger key={schedule.id} value={schedule.id}>
                {schedule.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <Dialog open={isAddScheduleDialogOpen} onOpenChange={setIsAddScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost"><Plus className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md glass-card">
              <DialogHeader>
                <DialogTitle>Add New Schedule</DialogTitle>
                <DialogDescription>Create a new schedule group, e.g., "2nd Year".</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSchedule}>
                <div className="grid gap-4 py-4">
                  <Label htmlFor="schedule-name">Schedule Name</Label>
                  <Input id="schedule-name" value={newScheduleName} onChange={(e) => setNewScheduleName(e.target.value)} placeholder="e.g., 2nd Year" required className="bg-white/50 dark:bg-black/20" />
                </div>
                <DialogFooter>
                  <Button type="submit" className="gradient-button w-full">Create Schedule</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {schedules.map((schedule) => (
          <TabsContent value={schedule.id} key={schedule.id}>
            <Card className="glass-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{schedule.name} Schedule</CardTitle>
                    <CardDescription>Manage the bell schedule for {schedule.name.toLowerCase()}.</CardDescription>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteSchedule(schedule.id)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              </Header>
              <CardContent className="space-y-3">
                {(bells[schedule.id] || []).length > 0 ? (
                  bells[schedule.id].map((bell) => (
                    <div key={bell.id} className="flex items-center justify-between rounded-2xl border p-3 bg-background/50">
                      <div>
                        <p className="font-semibold">{bell.label}</p>
                        <p className="text-sm text-muted-foreground">{bell.time}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleDeleteBell(bell.id)} className="text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Bell
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center p-4">No bells scheduled. Add one below!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
        {schedules.length === 0 && (
          <div className="text-center p-8">
            <p className="text-muted-foreground">No schedules found.</p>
            <Button onClick={() => setIsAddScheduleDialogOpen(true)} className="mt-4">Create Your First Schedule</Button>
          </div>
        )}
      </Tabs>

      <Dialog open={isAddBellDialogOpen} onOpenChange={setIsAddBellDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gradient-button fixed bottom-20 right-4 h-16 w-16 rounded-full shadow-lg z-10">
            <Plus className="h-8 w-8" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md glass-card">
          <DialogHeader>
            <DialogTitle>Add New Bell</DialogTitle>
            <DialogDescription>Set the time, label, and recurrence for the new bell.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddBell} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="schedule" className="text-right">Schedule</Label>
              <Select name="schedule" required defaultValue={activeTab}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a schedule" /></SelectTrigger>
                <SelectContent>
                  {schedules.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">Time</Label>
              <Input id="time" name="time" type="time" required className="col-span-3 bg-white/50 dark:bg-black/20" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">Label</Label>
              <Input id="label" name="label" placeholder="e.g., Lunch Break" required className="col-span-3 bg-white/50 dark:bg-black/20" />
            </div>
            <div>
              <Label className="mb-3 block text-center">Repeat on</Label>
              <div className="flex justify-center items-center gap-2">
                {daysOfWeek.map((day, index) => (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <Checkbox id={`day-${day}`} defaultChecked />
                    <Label htmlFor={`day-${day}`} className="text-xs">{day}</Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="gradient-button w-full">Save Bell</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedules;