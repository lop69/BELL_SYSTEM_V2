import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthProvider";
import { logUserAction } from "@/lib/logger";
import { showError, showSuccess } from "@/utils/toast";
import { fetchScheduleGroups, addScheduleGroup, deleteScheduleGroup, addSchedule, setActiveSchedule } from "@/api/schedules";
import { ScheduleFormValues } from "@/lib/schemas";

const queryKey = ['scheduleGroups'];

export const useSchedules = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: scheduleGroups = [], ...queryInfo } = useQuery({
    queryKey,
    queryFn: fetchScheduleGroups,
  });

  const addGroupMutation = useMutation({
    mutationFn: (values: ScheduleFormValues) => {
      logUserAction(user, 'CREATE_SCHEDULE_GROUP', { name: values.name });
      return addScheduleGroup(values, user!.id);
    },
    onSuccess: () => {
      showSuccess("Schedule Group created!");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => showError(error.message),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => {
      logUserAction(user, 'DELETE_SCHEDULE_GROUP', { groupId });
      return deleteScheduleGroup(groupId);
    },
    onSuccess: () => {
      showSuccess("Group deleted.");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => showError(error.message),
  });

  const addScheduleMutation = useMutation({
    mutationFn: ({ values, groupId }: { values: ScheduleFormValues, groupId: string }) => {
      logUserAction(user, 'CREATE_SCHEDULE', { name: values.name, groupId });
      return addSchedule(values, groupId, user!.id);
    },
    onSuccess: () => {
      showSuccess("Schedule created!");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => showError(error.message),
  });

  const setActiveMutation = useMutation({
    mutationFn: ({ scheduleId, groupId }: { scheduleId: string, groupId: string }) => {
      logUserAction(user, 'SET_ACTIVE_SCHEDULE', { scheduleId, groupId });
      return setActiveSchedule(scheduleId, groupId);
    },
    onSuccess: () => {
      showSuccess("Active schedule updated.");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => showError(error.message),
  });

  return {
    scheduleGroups,
    ...queryInfo,
    addGroup: addGroupMutation.mutate,
    isAddingGroup: addGroupMutation.isPending,
    deleteGroup: deleteGroupMutation.mutate,
    addSchedule: addScheduleMutation.mutate,
    isAddingSchedule: addScheduleMutation.isPending,
    setActive: setActiveMutation.mutate,
    isSettingActive: setActiveMutation.isPending,
  };
};