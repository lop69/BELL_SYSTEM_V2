import React, { useState } from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Bell, CheckCircle, Plus, Trash2, Loader2 } from "lucide-react";
import { Schedule, ScheduleGroup } from "@/types/database";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { scheduleFormSchema, ScheduleFormValues } from "@/lib/schemas";
import BellManagementDialog from './BellManagementDialog';
import { useSchedules } from '@/hooks/useSchedules';

interface ScheduleGroupItemProps {
  group: ScheduleGroup;
}

const ScheduleForm = ({ groupId, onFinished }: { groupId: string, onFinished: () => void }) => {
  const { addSchedule, isAddingSchedule } = useSchedules();
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: { name: "" },
  });

  const handleSubmit = (values: ScheduleFormValues) => {
    addSchedule({ values, groupId }, {
      onSuccess: onFinished,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
        <Button type="submit" className="w-full gradient-button" disabled={isAddingSchedule}>
          {isAddingSchedule && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Schedule
        </Button>
      </form>
    </Form>
  );
};

const ScheduleGroupItem = ({ group }: ScheduleGroupItemProps) => {
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [isBellDialogOpen, setIsBellDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const { deleteGroup, setActive, isSettingActive } = useSchedules();

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
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}>
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
                      <Button size="sm" onClick={() => setActive({ scheduleId: schedule.id, groupId: group.id })} disabled={isSettingActive}>
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