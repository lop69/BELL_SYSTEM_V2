import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, BellOff } from "lucide-react";
import { Schedule, Bell } from "@/types/database";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bellFormSchema, BellFormValues } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";
import BellItem from './BellItem';
import { useBells } from '@/hooks/useBells';

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BellForm = ({ scheduleId, bell, onFinished, isSubmitting, onSubmit }: { scheduleId: string, bell?: Bell, onFinished: () => void, isSubmitting: boolean, onSubmit: (values: BellFormValues) => void }) => {
  const form = useForm<BellFormValues>({
    resolver: zodResolver(bellFormSchema),
    defaultValues: {
      schedule_id: scheduleId,
      time: bell?.time || "",
      label: bell?.label || "",
      days_of_week: bell?.days_of_week || [0, 1, 2, 3, 4, 5, 6],
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        <Button type="submit" className="w-full gradient-button" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {bell ? 'Save Changes' : 'Add Bell'}
        </Button>
      </form>
    </Form>
  );
};

interface BellManagementDialogProps {
  schedule: Schedule;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BellManagementDialog = ({ schedule, isOpen, onOpenChange }: BellManagementDialogProps) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingBell, setEditingBell] = useState<Bell | null>(null);
  const { bells, isLoading, manageBell, isManagingBell, deleteBell } = useBells(schedule.id);

  const handleEdit = useCallback((bell: Bell) => {
    setEditingBell(bell);
    setIsFormVisible(true);
  }, []);

  const handleAddNew = () => {
    setEditingBell(null);
    setIsFormVisible(true);
  };

  const handleFormFinished = () => {
    setIsFormVisible(false);
    setEditingBell(null);
  };

  const handleFormSubmit = (values: BellFormValues) => {
    manageBell({ values, bell: editingBell || undefined }, {
      onSuccess: handleFormFinished,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Bells for "{schedule.name}"</DialogTitle>
          <DialogDescription>Add, edit, or remove bells for this schedule.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-2">
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-20 w-full rounded-2xl" /><Skeleton className="h-20 w-full rounded-2xl" /></div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {bells.length > 0 ? (
                  bells.map((bell) => <BellItem key={bell.id} bell={bell} onEdit={handleEdit} onDelete={deleteBell} />)
                ) : (
                  !isFormVisible && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 flex flex-col items-center gap-4">
                      <BellOff className="h-16 w-16 text-primary/30" />
                      <p className="text-muted-foreground">No bells in this schedule yet.</p>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 pt-4">
          <AnimatePresence mode="wait">
            {isFormVisible ? (
              <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                <BellForm scheduleId={schedule.id} bell={editingBell || undefined} onFinished={handleFormFinished} isSubmitting={isManagingBell} onSubmit={handleFormSubmit} />
              </motion.div>
            ) : (
              <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button className="w-full" onClick={handleAddNew}>
                  <Plus className="mr-2 h-4 w-4" /> Add New Bell
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BellManagementDialog;