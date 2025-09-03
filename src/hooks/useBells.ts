import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthProvider";
import { logUserAction } from "@/lib/logger";
import { showError, showSuccess } from "@/utils/toast";
import { fetchBellsForSchedule, manageBell, deleteBell } from "@/api/bells";
import { BellFormValues } from "@/lib/schemas";
import { Bell } from "@/types/database";

export const useBells = (scheduleId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = ['bells', scheduleId];

  const { data: bells = [], ...queryInfo } = useQuery({
    queryKey,
    queryFn: () => fetchBellsForSchedule(scheduleId),
    enabled: !!scheduleId,
  });

  const manageBellMutation = useMutation({
    mutationFn: ({ values, bell }: { values: BellFormValues, bell?: Bell }) => {
      const action = bell ? 'UPDATE_BELL' : 'CREATE_BELL';
      logUserAction(user, action, { bellId: bell?.id, scheduleId: values.schedule_id, label: values.label });
      return manageBell(values, user!.id, bell);
    },
    onSuccess: (_, { bell }) => {
      showSuccess(`Bell ${bell ? 'updated' : 'added'} successfully!`);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => showError(error.message),
  });

  const deleteBellMutation = useMutation({
    mutationFn: (bellId: string) => {
      logUserAction(user, 'DELETE_BELL', { bellId });
      return deleteBell(bellId);
    },
    onSuccess: () => {
      showSuccess("Bell deleted.");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => showError(error.message),
  });

  return {
    bells,
    ...queryInfo,
    manageBell: manageBellMutation.mutate,
    isManagingBell: manageBellMutation.isPending,
    deleteBell: deleteBellMutation.mutate,
  };
};