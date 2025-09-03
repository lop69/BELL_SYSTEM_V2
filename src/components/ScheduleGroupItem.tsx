import React, { useState } from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Bell, CheckCircle, Plus, Trash2, Edit, Loader2, MoreVertical } from "lucide-react";
import { Schedule, ScheduleGroup } from "@/types/database";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { scheduleFormSchema, ScheduleFormValues } from "@/lib/schemas";
import { useAuth } from "@/contexts/AuthProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logUserAction } from "@/lib/logger";
import { showError, showSuccess } from "@/utils/toast";
import BellManagementDialog from './BellManagementDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface ScheduleGroupItemProps {
  group: ScheduleGroup;
}

const ScheduleForm = ({ groupId, onFinished }: { groupId: string, onFinished: () => void }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: { name: "" },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (values: ScheduleFormValues) => {
      if (!user) throw new Error("User not authenticated");
      logUserAction(user, 'CREATE_SCHEDULE', { name: values.name, groupId });
      const { data, error } = await supabase
        .from("schedules")
        .insert({ name: values.name, user_id: user.id, schedule_group_id: groupId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess("Schedule created!");
      onFinished();
    },
    onError: (error) => showError(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleGroups'] });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => scheduleMutation.mutate(v))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Regular, Exams" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full gradient-button" disabled={scheduleMutation.isPending}>
          {scheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Schedule
        </Button>
      </form>
    </Form>
  );
};

const ScheduleGroupItem = ({ group }: ScheduleGroupItemProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [isBellDialogOpen, setIsBellDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      logUserAction(user, 'DELETE_SCHEDULE_GROUP', { groupId });
      const { error } = await supabase.from("schedule_groups").delete().eq("id", groupId);
      if (error) throw error;
    },
    onSuccess: () => showSuccess("Group deleted."),
    onError: (error) => showError(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['scheduleGroups'] }),
  });

  const setActiveScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      logUserAction(user, 'SET_ACTIVE_SCHEDULE', { scheduleId, groupId: group.id });
      const { error } = await supabase.rpc('set_active_schedule', {
        target_schedule_id: scheduleId,
        target_group_id: group.id,
      });
      if (error) throw error;
    },
    onSuccess: () => showSuccess("Active schedule updated."),
    onError: (error) => showError(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['scheduleGroups'] }),
  });

  const handleManageBells = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsBellDialogOpen(true);
  };

  return (
    <AccordionItem value={group.id} className="border-none">
      <Card className="glass-card overflow-hidden">
        <AccordionTrigger className="p-4 hover:no-underline">
          <div className="flex justify-between items-center w-full">
            <CardTitle>{group.name}</CardTitle>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteGroupMutation.mutate(group.id); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
          <div className="space-y-3">
            {group.schedules.length > 0 ? (
              group.schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between rounded-lg border p-3 bg-background/30">
                  <div className="flex items-center gap-3">
                    {schedule.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5" />
                    )}
                    <p className="font-medium">{schedule.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleManageBells(schedule)}>
                      <Bell className="mr-2 h-4 w-4" /> Manage Bells
                    </Button>
                    {!schedule.is_active && (
                      <Button size="sm" onClick={() => setActiveScheduleMutation.mutate(schedule.id)} disabled={setActiveScheduleMutation.isPending}>
                        Set Active
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No schedules in this group yet.</p>
            )}
            <Dialog open={isAddScheduleOpen} onOpenChange={setIsAddScheduleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Add Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md glass-card">
                <DialogHeader>
                  <DialogTitle>Add New Schedule to "{group.name}"</DialogTitle>
                  <DialogDescription>Create a new schedule within this group.</DialogDescription>
                </DialogHeader>
                <ScheduleForm groupId={group.id} onFinished={() => setIsAddScheduleOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </AccordionContent>
      </Card>
      {selectedSchedule && (
        <BellManagementDialog
          schedule={selectedSchedule}
          isOpen={isBellDialogOpen}
          onOpenChange={setIsBellDialogOpen}
        />
      )}
    </AccordionItem>
  );
};

export default ScheduleGroupItem;