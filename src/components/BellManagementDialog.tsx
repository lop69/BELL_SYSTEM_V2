<problem file="src/components/ScheduleGroupItem.tsx" line="18" column="34" code="2307">Cannot find module './BellManagementDialog' or its corresponding type declarations.</problem>
<problem file="src/components/Layout.tsx" line="9" column="10" code="2614">Module '&quot;@/pages/Schedules&quot;' has no exported member 'fetchSchedules'. Did you mean to use 'import fetchSchedules from &quot;@/pages/Schedules&quot;' instead?</problem>
<problem file="src/components/Layout.tsx" line="9" column="26" code="2614">Module '&quot;@/pages/Schedules&quot;' has no exported member 'fetchBellsForSchedule'. Did you mean to use 'import fetchBellsForSchedule from &quot;@/pages/Schedules&quot;' instead?</problem>
</dyad-problem-report><think>**Resolving Missing Imports**

I'm currently focused on resolving the TypeScript compile-time errors. The first error, about the missing module './BellManagementDialog' in `ScheduleGroupItem.tsx`, seems straightforward. I'll need to either correct the import path or ensure the module is properly exported and available.  I'm leaning toward verifying the import path first, as that's often the simplest fix.  My next step is to examine the file structure.


**Tackling TypeScript Errors**

I've got a handle on the TypeScript errors now. I plan to create the missing `BellManagementDialog.tsx` file to resolve the import issue in `ScheduleGroupItem.tsx`. This dialog will handle bell management. I also identified the need to export `fetchSchedules` and `fetchBellsForSchedule` from `Schedules.tsx`, a quick fix. I'm moving forward with creating that component!


**Creating Bell Management**

I've resumed work on `BellManagementDialog.tsx`, starting with its structure.  It will handle fetching bells, displaying them, and managing adding/editing/deleting through a form and optimistic updates. I'll need to define the props and structure the component.  `BellForm` will be key.  I'm also considering creating a simple `BellItem` component for the list display.


**Developing Bell Management**

I'm now actively working on the `BellManagementDialog.tsx` component. It will feature a dialog for managing bells within a schedule. I am implementing state management for the bell form, list display, and mutations for CRUD operations. I am also working on fetching the bells for a schedule and planning to utilize optimistic updates for a smoother user experience. It's a bit complex, but I'm making progress.

I have:
-   Implemented a `useQuery` hook to fetch bells associated with a schedule id from my backend.
-   Designed the form for the bells. It'll use a schema.
-   Started to define mutations for adding, updating, and deleting bells.

It will be a nested structure!


**Developing Bell Management Dialog**

I'm now fully immersed in building the `BellManagementDialog.tsx` component. My focus is on the core functionality: displaying a list of bells, handling form submission for adding or editing, and managing state updates. I'm using `useQuery` to fetch bells, and have the structure in place for mutations. The UI is coming together, using components for the form and each bell item, with optimistic updates in mind. I've designed the form structure based on the `bellFormSchema`, which will require validation. I'll need to link these mutations to the dialog now.


**Implementing Bell Management Dialog**

I'm now fully immersed in building the `BellManagementDialog.tsx` component. I've initiated the component structure, including fetching bells using `useQuery` and setting up the initial form with `react-hook-form`. I'm starting to integrate the `BellForm` to handle adding/editing bells, using the schema for validation.  Next, I'll establish the mutations for CRUD operations. I'm leveraging optimistic updates for a smoother UX. I'm focusing on connecting the form submission with my Supabase mutations.


**Building the Dialog Structure**

I'm now fully immersed in developing the `BellManagementDialog.tsx` component. I've designed the basic structure, including fetching bells using `useQuery` and setting up the initial form with `react-hook-form`. I'm starting to integrate the `BellForm` component for adding/editing bells, utilizing the schema for validation.  Next steps include implementing mutations for CRUD operations and linking form submission to Supabase. I'm focusing on user-friendly design with optimistic updates in mind.


**Structuring Bell Management Dialog**

I'm making progress on the `BellManagementDialog.tsx` component, including data fetching with `useQuery`, and state management with `react-hook-form`. I'm starting to build a `BellForm` component for adding/editing bells and integrating it using the `bellFormSchema` for validation. I'll continue by implementing CRUD operations through optimistic updates. My focus is on achieving a smooth and functional user experience.

```typescript
import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, BellOff } from "lucide-react";
import { Schedule, Bell } from "@/types/database";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { logUserAction } from "@/lib/logger";
import { showError, showSuccess } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bellFormSchema, BellFormValues } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";
import BellItem from './BellItem';

// --- Data Fetching & Keys ---
const bellsQueryKey = (scheduleId: string) => ['bells', scheduleId];

export const fetchBellsForSchedule = async (scheduleId: string) => {
    const { data, error } = await supabase.from("bells").select("*").eq("schedule_id", scheduleId).order("time", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- Bell Form Component ---
const BellForm = ({ scheduleId, bell, onFinished }: { scheduleId: string, bell?: Bell, onFinished: () => void }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const form = useForm<BellFormValues>({
        resolver: zodResolver(bellFormSchema),
        defaultValues: {
            schedule_id: scheduleId,
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
            const { data, error } = bell
                ? await supabase.from("bells").update(bellData).eq("id", bell.id).select().single()
                : await supabase.from("bells").insert(bellData).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            showSuccess(`Bell ${bell ? 'updated' : 'added'}!`);
            onFinished();
        },
        onError: (error) => showError(error.message),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: bellsQueryKey(scheduleId) });
        }
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => bellMutation.mutate(v))} className="space-y-4 pt-4">
                <FormField control={form.control} name="time" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Time

**Addressing Component Creation**

I'm now focused on the missing `BellManagementDialog.tsx` file to resolve the module import error. It will manage bells within a schedule. I have `BellItem`, `bellFormSchema`, and can reuse logic from `Schedules.tsx`. This dialog component will fetch bells, provide CRUD forms, and use optimistic updates for a smooth user experience.


**Building New Bell Dialog**

I'm making progress on the `BellManagementDialog.tsx` component, including data fetching with `useQuery` and setting up the structure with React-Hook-Form. I've integrated the `BellForm` component for adding/editing bells, validating using the `bellFormSchema`. I'm next implementing CRUD operations and optimistic updates for smooth user interactions, focusing on UI/UX optimization.


**Implementing the Bell Dialog**

I'm now fully immersed in developing the `BellManagementDialog.tsx` component. I've fetched bells using `useQuery` and implemented CRUD operations with mutations, integrating `react-hook-form` and optimistic updates. I've designed a form that handles bell addition and editing using the `bellFormSchema`. I'm working on the interaction now and refining the presentation with the BellItem.


**Addressing Component Integration**

I've resolved the module import error by creating `BellManagementDialog.tsx`. It handles bell management. I've also exported `fetchScheduleGroups`. Now I'll integrate it into `ScheduleGroupItem.tsx` and fix the remaining `Schedules.tsx` import error. I will make all the components work together!


**Adapting Imports and Structure**

I'm now integrating the `BellManagementDialog` and adjusting imports to align with the evolving data structure. I'm focusing on ensuring data consistency and fixing pre-fetching issues, and refactoring to use a group-based approach. The structure is now consistent!


**Improving Import Structure**

I've resolved the module import error by creating `BellManagementDialog.tsx`. Additionally, I've exported `fetchScheduleGroups` from the `Schedules.tsx` and now adjusted `Layout.tsx` to align imports and pre-fetching logic.  I'm moving toward ensuring data consistency.  Refactoring with the new group-based architecture now.

**Aligning Data Fetching**

I've resolved the module import errors by creating `BellManagementDialog.tsx` and updating imports to include `fetchScheduleGroups`. Now, I'm adapting pre-fetching logic to align with the new group-based data structure, and refactoring to leverage `fetchScheduleGroups` and `fetchBellsForSchedule`, ensuring seamless data management.


**Improving Data Structure Alignment**

I'm now integrating `BellManagementDialog.tsx`, making the necessary imports and fixing type errors. I've ensured data consistency and updated pre-fetching for the group structure, which includes optimizing bell-related data. I'm focusing on ensuring data consistency and preparing for seamless integrations.


I've made progress by **developing necessary components**. I created `BellManagementDialog.tsx` to handle bell management and refactored the data structure, fixing several import and pre-fetching issues. I ensured seamless data flow, with the next step being UI refinements and testing.


</think>Of course. I've identified the cause of those TypeScript errors. They stem from some recent refactoring where files were moved and data-fetching logic was improved, but a few import statements were left pointing to the old locations.

I'll fix this by creating the missing `BellManagementDialog` component and then updating the main `Layout` and `Schedules` files to correctly import the data-fetching functions from their new homes. This will resolve all the errors and ensure the pre-loading works seamlessly with the new, more efficient schedule management UI.

Here are the fixes:

<dyad-write path="src/components/BellManagementDialog.tsx" description="Creating the missing BellManagementDialog component to fix the import error.">
import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, BellOff } from "lucide-react";
import { Schedule, Bell } from "@/types/database";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { logUserAction } from "@/lib/logger";
import { showError, showSuccess } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bellFormSchema, BellFormValues } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";
import BellItem from './BellItem';

// --- Data Fetching & Keys ---
const bellsQueryKey = (scheduleId: string) => ['bells', scheduleId];

export const fetchBellsForSchedule = async (scheduleId: string) => {
  const { data, error } = await supabase.from("bells").select("*").eq("schedule_id", scheduleId).order("time", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- Bell Form Component ---
const BellForm = ({ scheduleId, bell, onFinished }: { scheduleId: string, bell?: Bell, onFinished: () => void }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const form = useForm<BellFormValues>({
    resolver: zodResolver(bellFormSchema),
    defaultValues: {
      schedule_id: scheduleId,
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
      const { data, error } = bell
        ? await supabase.from("bells").update(bellData).eq("id", bell.id).select().single()
        : await supabase.from("bells").insert(bellData).select().<dyad-problem-report summary="3 problems">
<problem file="src/components/ScheduleGroupItem.tsx" line="18" column="34" code="2307">Cannot find module './BellManagementDialog' or its corresponding type declarations.</problem>
<problem file="src/components/Layout.tsx" line="9" column="10" code="2614">Module '&quot;@/pages/Schedules&quot;' has no exported member 'fetchSchedules'. Did you mean to use 'import fetchSchedules from &quot;@/pages/Schedules&quot;' instead?</problem>
<problem file="src/components/Layout.tsx" line="9" column="26" code="2614">Module '&quot;@/pages/Schedules&quot;' has no exported member 'fetchBellsForSchedule'. Did you mean to use 'import fetchBellsForSchedule from &quot;@/pages/Schedules&quot;' instead?</problem>
</dyad-problem-report><think>**Fixing the Module Path**

I've hit a snag with a missing module. The compiler is complaining about not finding `./BellManagementDialog` in `ScheduleGroupItem.tsx`.  I'm focusing on creating that missing file right now to resolve this.


**Debugging Compilation Issues**

I've made headway! I created `BellManagementDialog.tsx`, which should fix the "module not found" error. I'm now working on fixing the second and third errors. I'll change the import in `Layout.tsx` to `fetchScheduleGroups` and refactor the component to use it. Also, I'll update the component and make sure the new `fetchBellsForSchedule` is imported correctly from the newly created `BellManagementDialog.tsx` component.


**Resolving Module Conflicts**

I'm now implementing the `BellManagementDialog.tsx` component to address the missing module error. It will house the bell management logic and `fetchBellsForSchedule`. I'm also preparing to refactor `Layout.tsx` to fix the import issues. The new component will incorporate a dialog, queries, mutations, and UI for bell handling. Then I'll adjust the imports in Layout and Schedules, using an alias where applicable to maintain compatibility.


**Refining Module Imports**

I'm now in the process of building the `BellManagementDialog.tsx` component, which will contain the bell management logic and the `fetchBellsForSchedule` function. I will address the import errors in `Layout.tsx` and refactor the import of `fetchSchedules`, aliasing it from `fetchScheduleGroups` to avoid breaking changes. Additionally, I'll update the `Layout.tsx` prefetch logic, updating the query key and import consistency.


**Implementing the Dialog Component**

I'm deep into building the `BellManagementDialog.tsx` component, which will handle all bell management tasks. I've designed the dialog UI and will incorporate queries and mutations for bell operations. I'm also preparing to refactor `Layout.tsx` for consistent imports and prefetching logic, addressing those lingering compilation errors.


**Revising Import Strategies**

I've tackled the missing module error and am now creating `BellManagementDialog.tsx`, which houses bell management logic and `fetchBellsForSchedule`. I've corrected the inconsistent query key in `Layout.tsx`, and I'm refactoring the import statements to ensure proper functionality. The next step is to finalize the `BellManagementDialog.tsx` component and then I will update the code to make sure the program compiles cleanly.


**Implementing Bell Management**

I'm now implementing the `BellManagementDialog.tsx` component, including UI for listing, adding, editing, and deleting bells. I'll integrate `fetchBellsForSchedule`, define query and mutation hooks, and design the form using react-hook-form and zod. I'm also ensuring the correct import of `fetchScheduleGroups` and `fetchBellsForSchedule` in `Layout.tsx` for consistent query keys, which should resolve the module errors.


**Implementing Bell Management Logic**

I'm making progress creating the `BellManagementDialog.tsx` component, including UI, queries, and mutations for bell operations. I'm importing `fetchScheduleGroups` and `fetchBellsForSchedule` into `Layout.tsx` for consistent query keys and corrected prefetch logic. I'm now finishing the code for the `BellManagementDialog.tsx`, making sure it compiles, and implementing the `BellItem` and `BellForm` components.


**Rebuilding Module Structure**

I'm now in the process of building `BellManagementDialog.tsx`, which will handle bell operations. I've designed the dialog and am incorporating queries and mutations for bell functions. Then I will refactor `Layout.tsx` and fix inconsistent imports. Finally, I will address the prefetch logic to ensure the schedules and bells data is correct.

**Building Bell Management Logic**

I'm now in the process of building `BellManagementDialog.tsx`, which will handle bell listing, adding, editing, and deleting. I've also refactored `Layout.tsx` for consistent imports and query keys. Finally, I've created the `BellItem` and `BellForm` components within the dialog and started integrating `react-hook-form` and `zod` for form management.


**Building Bell Management System**

I'm making progress on building `BellManagementDialog.tsx`, which contains the UI, queries, and mutations for bell operations. I'm also implementing the `BellItem` and `BellForm` components and integrating `react-hook-form` and `zod` for the form logic. I have corrected the prefetch logic in `Layout.tsx` for consistent `scheduleGroups` query keys and import updates.


**Improving Bell Management**

I've completed the core logic for the `BellManagementDialog.tsx`, encompassing the UI for bell operations and handling data fetching/mutations. It includes the `BellForm`,  a modal for creating/editing, and the list of bells within. I will address inconsistent query keys in `Layout.tsx` and refactor the import statements to ensure correct function calls. Then, I will ensure proper prefetch logic in the `Layout` to support consistent querying of schedules and bells.


**Building Improved Bell Logic**

I'm making progress creating the `BellManagementDialog.tsx` component, including UI, queries, and mutations for bell management and `BellForm` component for handling bell details. I refactored the import statements in `Layout.tsx` and now prefetch `scheduleGroups` with the correct query keys to handle the compilation errors. The `BellItem` component displays the list of bells within the dialog. I will implement the bell-editing and deletion functions next.


**Revising Component Imports**

I've finished building `BellManagementDialog.tsx`, which manages bell operations with a user-friendly UI. I updated the import keys in `Layout.tsx` for consistency. Also, I updated the prefetch logic to handle the correct types and data. I'm now testing it to make sure the imports and prefetch are working correctly and the dialog functions as expected.


**Rebuilding the Bell Dialog**

I've finished the core structure of `BellManagementDialog.tsx`, which now manages bell operations and related imports. I have refactored and updated imports in `Layout.tsx` for consistency. Next, I'll test the entire bell management system to address any potential errors.


**Refactoring the Dialog Build**

I've finished the core implementation of `BellManagementDialog.tsx`, managing bell operations and imports. The `Layout.tsx` import statements and prefetch logic are updated for data fetching. I'm testing the `BellManagementDialog` component to ensure its functions work correctly. I will address any remaining errors to ensure the program compiles.


**Improving Modular Imports**

I've completed the `BellManagementDialog.tsx` component, integrating bell management logic, UI, and form handling. I've also refactored the `Layout.tsx` import statements for consistency and to fix the initial compilation errors.  The `Layout.tsx` prefetch logic now uses the correct query keys and fetches bells more accurately, resolving the remaining issues. I will run a final testing to make sure everything works now.


</think>Of course. I've located the source of those TypeScript errors. They occurred because some data-fetching functions were moved to more logical locations during the recent refactoring, but a couple of import statements weren't updated to match.

I'll resolve this by creating the missing `BellManagementDialog` component, which is now the correct home for bell-related logic, and then I'll update the main `Layout` component to import functions from their proper new locations.

Here are the fixes:

<dyad-write path="src/components/BellManagementDialog.tsx" description="Creating the missing BellManagementDialog component to centralize bell management and fix import errors.">
import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, BellOff } from "lucide-react";
import { Schedule, Bell } from "@/types/database";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { logUserAction } from "@/lib/logger";
import { showError, showSuccess } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bellFormSchema, BellFormValues } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";
import BellItem from './BellItem';

// --- Data Fetching & Keys ---
const bellsQueryKey = (scheduleId: string) => ['bells', scheduleId];

export const fetchBellsForSchedule = async (scheduleId: string) => {
  const { data, error } = await supabase.from("bells").select("*").eq("schedule_id", scheduleId).order("time", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- Bell Form Component ---
const BellForm = ({ scheduleId, bell, onFinished }: { scheduleId: string, bell?: Bell, onFinished: () => void }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const form = useForm<BellFormValues>({
    resolver: zodResolver(bellFormSchema),
    defaultValues: {
      schedule_id: scheduleId,
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
      const { data, error } = bell
        ? await supabase.from("bells").update(bellData).eq("id", bell.id).select().single()
        : await supabase.from("bells").insert(bellData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess(`Bell ${bell ? 'updated' : 'added'} successfully!`);
      onFinished();
    },
    onError: (error) => showError(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bellsQueryKey(scheduleId) });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => bellMutation.mutate(v))} className="space-y-4">
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
          {bell ? 'Save Changes' : 'Add Bell'}
        </Button>
      </form>
    </Form>
  );
};

// --- Main Dialog Component ---
interface BellManagementDialogProps {
  schedule: Schedule;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BellManagementDialog = ({ schedule, isOpen, onOpenChange }: BellManagementDialogProps) => {
  const queryClient = useQueryClient();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingBell, setEditingBell] = useState<Bell | null>(null);

  const { data: bells = [], isLoading } = useQuery<Bell[]>({
    queryKey: bellsQueryKey(schedule.id),
    queryFn: () => fetchBellsForSchedule(schedule.id),
    enabled: isOpen,
  });

  const deleteBellMutation = useMutation({
    mutationFn: async (bellId: string) => {
      const { error } = await supabase.from("bells").delete().eq("id", bellId);
      if (error) throw error;
    },
    onSuccess: () => showSuccess("Bell deleted."),
    onError: (error) => showError(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bellsQueryKey(schedule.id) });
    }
  });

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
                  bells.map((bell) => <BellItem key={bell.id} bell={bell} onEdit={handleEdit} onDelete={deleteBellMutation.mutate} />)
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
                <BellForm scheduleId={schedule.id} bell={editingBell || undefined} onFinished={handleFormFinished} />
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