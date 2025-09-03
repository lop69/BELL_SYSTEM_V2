import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ServerCrash, Calendar, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { ScheduleGroup } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { scheduleFormSchema, ScheduleFormValues } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { logUserAction } from "@/lib/logger";
import ScheduleGroupItem from "@/components/ScheduleGroupItem";

// --- Data Fetching & Keys ---
const scheduleGroupsQueryKey = ['scheduleGroups'];

export const fetchScheduleGroups = async (): Promise<ScheduleGroup[]> => {
  const { data, error } = await supabase
    .from("schedule_groups")
    .select("*, schedules(*)")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as ScheduleGroup[]) || [];
};

// --- Components ---
const ScheduleGroupForm = ({ onFinished }: { onFinished: () => void }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: { name: "" },
  });

  const scheduleGroupMutation = useMutation({
    mutationFn: async (values: ScheduleFormValues) => {
      if (!user) throw new Error("User not authenticated");
      logUserAction(user, 'CREATE_SCHEDULE_GROUP', { name: values.name });
      const { data, error } = await supabase
        .from("schedule_groups")
        .insert({ name: values.name, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess("Schedule Group created!");
      onFinished();
    },
    onError: (error) => showError(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scheduleGroupsQueryKey });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => scheduleGroupMutation.mutate(v))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 1st Year, Main Campus" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full gradient-button" disabled={scheduleGroupMutation.isPending}>
          {scheduleGroupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Group
        </Button>
      </form>
    </Form>
  );
};

const Schedules = () => {
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);

  const { data: scheduleGroups = [], isLoading, isError } = useQuery<ScheduleGroup[]>({
    queryKey: scheduleGroupsQueryKey,
    queryFn: fetchScheduleGroups,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-8">
        <ServerCrash className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Failed to load schedules</h2>
        <p className="text-muted-foreground">Please check your connection and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1 className="text-3xl font-bold">Schedules</h1>
          <p className="text-muted-foreground">Organize your schedules into groups.</p>
        </motion.div>
        <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-button rounded-full">
              <Plus className="mr-2 h-4 w-4" /> Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md glass-card">
            <DialogHeader>
              <DialogTitle>Add New Schedule Group</DialogTitle>
              <DialogDescription>Create a container for related schedules, like "Regular" and "Exams".</DialogDescription>
            </DialogHeader>
            <ScheduleGroupForm onFinished={() => setIsAddGroupOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {scheduleGroups.length > 0 ? (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {scheduleGroups.map((group) => (
            <ScheduleGroupItem key={group.id} group={group} />
          ))}
        </Accordion>
      ) : (
        <Card className="glass-card text-center p-8 flex flex-col items-center gap-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          >
            <Calendar className="h-16 w-16 text-primary/30" />
          </motion.div>
          <CardHeader className="p-0">
            <CardTitle>No Schedule Groups Yet</CardTitle>
            <CardDescription>Click the '+ Group' button to create your first group.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

export default Schedules;