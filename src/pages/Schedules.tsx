import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ServerCrash, Calendar, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { scheduleFormSchema, ScheduleFormValues } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ScheduleGroupItem from "@/components/ScheduleGroupItem";
import { useSchedules } from "@/hooks/useSchedules";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

const ScheduleGroupForm = ({ onFinished }: { onFinished: () => void }) => {
  const { addGroup, isAddingGroup } = useSchedules();
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: { name: "" },
  });

  const handleSubmit = (values: ScheduleFormValues) => {
    addGroup(values, {
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
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 1st Year, Main Campus" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full gradient-button" disabled={isAddingGroup}>
          {isAddingGroup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Group
        </Button>
      </form>
    </Form>
  );
};

const Schedules = () => {
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { scheduleGroups, isLoading, isError } = useSchedules();

  const filteredGroups = useMemo(() =>
    scheduleGroups.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [scheduleGroups, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search groups..."
          className="pl-10 glass-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredGroups.length > 0 ? (
        <Accordion type="single" collapsible className="w-full space-y-4" asChild>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {filteredGroups.map((group) => (
                <motion.div key={group.id} variants={itemVariants} layout>
                  <ScheduleGroupItem group={group} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
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
            <CardTitle>No Schedule Groups Found</CardTitle>
            <CardDescription>
              {searchTerm ? `No groups match "${searchTerm}".` : "Click the '+ Group' button to create one."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

export default Schedules;