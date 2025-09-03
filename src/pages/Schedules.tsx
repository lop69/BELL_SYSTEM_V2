import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Trash2, Edit, Loader2, ServerCrash, BellOff, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { Schedule, Bell } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useQuery, useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bellFormSchema, BellFormValues, scheduleFormSchema, ScheduleFormValues } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { logUserAction } from "@/lib/logger";
import BellItem from "@/components/BellItem";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- Data Fetching ---
const schedulesQueryKey: QueryKey = ['schedules'];
const bellsQueryKey = (scheduleId: string): QueryKey => ['bells', scheduleId];

export const fetchSchedules = async () => {
  const { data, error } = await supabase.from("schedules").select("*").order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

export const fetchBellsForSchedule = async (scheduleId: string) => {
  const { data, error } = await supabase.from("bells").select("*").eq("schedule_id", scheduleId).order("time", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

// --- Components ---
const BellForm = ({ schedules, activeTab, bell, onFinished }: { schedules: Schedule[], activeTab?: string, bell?: Bell, onFinished: () => void }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<BellFormValues>({
    resolver: zodResolver(bellFormSchema),
    defaultValues: {
      schedule_id: bell?.schedule_id || activeTab || "",
      time: bell?.time || "",
      label: bell?.label || "",
      days_of_week: bell?.days_of_week || [0, 1, 2, 3, 4, 5, 6],
    },
  });

  const bellMutation = useMutation({
    mutationFn: async (values: BellFormValues) => {
      if (!user) throw new Error("User not authenticated");
      const action = bell ? 'UPDATE_BELL' : 'CREATE_BELL';
      logUserAction(user, action, { bellId: bell?.id, scheduleId: values.schedule_id, label: values.label });
      
      const bellData = { ...values, user_id: user.id };
      const { error } = bell
        ? await supabase.from("bells").update(bellData).eq("id", bell.id)
        : await supabase.from("bells").insert(bellData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bells'] });
      showSuccess(`Bell ${bell ? 'updated' : 'added'} successfully!`);
      onFinished();
    },
    onError: (error) => showError(error.message),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => bellMutation.mutate(v))} className="space-y-4">
        <FormField control={form.control} name="schedule_id" render={({ field }) => (
          <FormItem><FormLabel>Schedule</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a schedule" /></SelectTrigger></FormControl><SelectContent>{schedules.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="label" render={({ field }) => (<FormItem><FormLabel>Label</FormLabel><FormControl><Input placeholder="e.g., Lunch Break" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="days_of_week" render={() => (
          <FormItem><FormLabel>Repeat on</FormLabel><div className="flex justify-center items-center gap-2 flex-wrap pt-2">{daysOfWeek.map((day, index) => (
            <FormField key={day} control={form.control} name="days_of_week" render={({ field }) => (
              <FormItem className="flex flex-col items-center gap-1"><FormControl><Checkbox checked={field.value?.includes(index)} onCheckedChange={(checked) => {
                return checked ? field.onChange([...field.value, index]) : field.onChange(field.value?.filter((v) => v !== index))
              }} /></FormControl><FormLabel className="text-xs !mt-0">{day}</FormLabel></FormItem>
            )} />
          ))}</div><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full gradient-button" disabled={bellMutation.isPending}>
          {bellMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Bell
        </Button>
      </form>
    </Form>
  );
};

const ScheduleForm = ({ onFinished }: { onFinished: () => void }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const form = useForm<ScheduleFormValues>({ resolver: zodResolver(scheduleFormSchema), defaultValues: { name: "" } });

  const scheduleMutation = useMutation({
    mutationFn: async (values: ScheduleFormValues) => {
      if (!user) throw new Error("User not authenticated");
      logUserAction(user, 'CREATE_SCHEDULE', { name: values.name });
      const { error } = await supabase.from("schedules").insert({ name: values.name, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulesQueryKey });
      showSuccess("Schedule created!");
      onFinished();
    },
    onError: (error) => showError(error.message),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => scheduleMutation.mutate(v))} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Schedule Name</FormLabel><FormControl><Input placeholder="e.g., 2nd Year" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <Button type="submit" className="w-full gradient-button" disabled={scheduleMutation.isPending}>
          {scheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Schedule
        </Button>
      </form>
    </Form>
  );
};

const ScheduleBells = React.memo(({ scheduleId, onEdit, onDelete }: { scheduleId: string, onEdit: (bell: Bell) => void, onDelete: (bellId: string) => void }) => {
  const { data: bells = [], isLoading } = useQuery<Bell[]>({
    queryKey: bellsQueryKey(scheduleId),
    queryFn: () => fetchBellsForSchedule(scheduleId),
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });

  if (isLoading) return <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>;

  return (
    <AnimatePresence>
      {bells.length > 0 ? (bells.map((bell) => (
        <BellItem key={bell.id} bell={bell} onEdit={onEdit} onDelete={onDelete} />
      ))) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 flex flex-col items-center gap-4">
          <motion.div initial={{ scale: 0.95, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}><BellOff className="h-16 w-16 text-primary/30" /></motion.div>
          <p className="text-muted-foreground">No bells in this schedule.</p>
          <p className="text-xs text-muted-foreground">Click the '+' button below to add one.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

const Schedules = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | undefined>();
  const [direction, setDirection] = useState(0);
  const [dialogs, setDialogs] = useState({ addSchedule: false, addBell: false, editBell: false });
  const [editingBell, setEditingBell] = useState<Bell | null>(null);

  const { data: schedules = [], isLoading: schedulesLoading, isError: schedulesError } = useQuery<Schedule[]>({
    queryKey: schedulesQueryKey,
    queryFn: fetchSchedules,
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });

  useEffect(() => {
    if (schedules && schedules.length > 0 && !activeTab) {
      setActiveTab(schedules[0].id);
    }
  }, [schedules, activeTab]);

  useEffect(() => {
    const handleChanges = () => {
      queryClient.invalidateQueries({ queryKey: schedulesQueryKey });
      if (activeTab) {
        queryClient.invalidateQueries({ queryKey: bellsQueryKey(activeTab) });
      }
    };

    const channel = supabase.channel('public-db-changes').on('postgres_changes', { event: '*', schema: 'public' }, handleChanges).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, activeTab]);

  const activeIndex = schedules.findIndex(s => s.id === activeTab);

  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      logUserAction(user, 'DELETE_SCHEDULE', { scheduleId });
      const { error } = await supabase.from("schedules").delete().eq("id", scheduleId);
      if (error) throw error;
    },
    onSuccess: (_, scheduleId) => {
      showSuccess("Schedule deleted.");
      const newSchedules = schedules.filter(s => s.id !== scheduleId);
      setActiveTab(newSchedules.length > 0 ? newSchedules[0].id : undefined);
    },
    onError: (error) => showError(error.message),
  });

  const deleteBellMutation = useMutation({
    mutationFn: async (bellId: string) => {
      logUserAction(user, 'DELETE_BELL', { bellId });
      const { error } = await supabase.from("bells").delete().eq("id", bellId);
      if (error) throw error;
    },
    onSuccess: () => showSuccess("Bell deleted."),
    onError: (error) => showError(error.message),
  });

  const handleEditBell = useCallback((bell: Bell) => {
    setEditingBell(bell);
    setDialogs(d => ({ ...d, editBell: true }));
  }, []);

  const handleDeleteBell = useCallback((bellId: string) => {
    deleteBellMutation.mutate(bellId);
  }, [deleteBellMutation]);

  const handleTabChange = (value: string) => {
    const newIndex = schedules.findIndex(s => s.id === value);
    setDirection(newIndex > activeIndex ? 1 : -1);
    setActiveTab(value);
  };

  const paginate = (newDirection: number) => {
    const newIndex = activeIndex + newDirection;
    if (newIndex >= 0 && newIndex < schedules.length) handleTabChange(schedules[newIndex].id);
  };

  const handleDragEnd = (_: any, { offset, velocity }: PanInfo) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -10000) paginate(1);
    else if (swipe > 10000) paginate(-1);
  };

  if (schedulesLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-1/3" /><Skeleton className="h-4 w-1/2 mt-2" /></div>
        <div className="space-y-4"><Skeleton className="h-10 w-full" /><Card className="glass-card"><CardHeader><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-2/3 mt-2" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></CardContent></Card></div>
      </div>
    );
  }

  if (schedulesError) return <div className="text-center p-8"><ServerCrash className="mx-auto h-12 w-12 text-destructive" /><h2 className="mt-4 text-xl font-semibold">Failed to load schedules</h2><p className="text-muted-foreground">Please check your connection and try again.</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold">Schedules</h1>
        <p className="text-muted-foreground">Manage your bell schedules and timings.</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <div className="flex items-center gap-2">
          <ScrollArea className="w-full whitespace-nowrap"><TabsList className="p-1 h-auto bg-muted/50 rounded-full w-max">{schedules.map((s) => (<TabsTrigger key={s.id} value={s.id} className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-md">{s.name}</TabsTrigger>))}</TabsList><ScrollBar orientation="horizontal" /></ScrollArea>
          <Dialog open={dialogs.addSchedule} onOpenChange={(open) => setDialogs(d => ({ ...d, addSchedule: open }))}><DialogTrigger asChild><Button size="icon" variant="outline" className="rounded-full flex-shrink-0"><Plus className="h-4 w-4" /></Button></DialogTrigger><DialogContent className="sm:max-w-md glass-card"><DialogHeader><DialogTitle>Add New Schedule</DialogTitle><DialogDescription>Create a new schedule group.</DialogDescription></DialogHeader><ScheduleForm onFinished={() => setDialogs(d => ({ ...d, addSchedule: false }))} /></DialogContent></Dialog>
        </div>
        <div className="relative overflow-x-hidden min-h-[400px]">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div key={activeTab} custom={direction} variants={{ enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: d < 0 ? "100%" : "-100%", opacity: 0 }) }} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.1} onDragEnd={handleDragEnd}>
              {schedules.length > 0 && activeIndex !== -1 && activeTab ? (
                <Card className="glass-card">
                  <CardHeader><div className="flex justify-between items-center gap-2"><div><CardTitle>{schedules[activeIndex]?.name}</CardTitle><CardDescription>Manage bells for {schedules[activeIndex]?.name.toLowerCase()}.</CardDescription></div>
                  <Button variant="destructive" size="sm" onClick={() => deleteScheduleMutation.mutate(schedules[activeIndex]?.id)} disabled={deleteScheduleMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                  </div></CardHeader>
                  <CardContent className="space-y-3">
                    <ScheduleBells scheduleId={activeTab} onEdit={handleEditBell} onDelete={handleDeleteBell} />
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-card text-center p-8 flex flex-col items-center gap-4">
                  <motion.div initial={{ scale: 0.95, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}><Calendar className="h-16 w-16 text-primary/30" /></motion.div>
                  <CardHeader className="p-0"><CardTitle>No Schedules Yet</CardTitle>
                  <CardDescription>Click the '+' button to create your first schedule.</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs>

      <>
        <Dialog open={dialogs.addBell} onOpenChange={(open) => setDialogs(d => ({ ...d, addBell: open }))}><DialogTrigger asChild><motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="fixed bottom-24 right-4 z-10"><Button className="gradient-button h-16 w-16 rounded-full shadow-lg" disabled={schedules.length === 0}><Plus className="h-8 w-8" /></Button></motion.div></DialogTrigger><DialogContent className="sm:max-w-md glass-card"><DialogHeader><DialogTitle>Add New Bell</DialogTitle></DialogHeader><BellForm schedules={schedules} activeTab={activeTab} onFinished={() => setDialogs(d => ({ ...d, addBell: false }))} /></DialogContent></Dialog>
        <Dialog open={dialogs.editBell} onOpenChange={(open) => setDialogs(d => ({ ...d, editBell: open }))}><DialogContent className="sm:max-w-md glass-card"><DialogHeader><DialogTitle>Edit Bell</DialogTitle></DialogHeader>{editingBell && <BellForm schedules={schedules} bell={editingBell} onFinished={() => setDialogs(d => ({ ...d, editBell: false }))} />}</DialogContent></Dialog>
      </>
    </div>
  );
};

export default Schedules;