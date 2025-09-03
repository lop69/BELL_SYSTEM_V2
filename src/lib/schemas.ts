import { z } from "zod";

export const bellFormSchema = z.object({
  schedule_id: z.string().min(1, "Please select a schedule."),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format."),
  label: z.string().min(2, "Label must be at least 2 characters.").max(50, "Label is too long."),
  days_of_week: z.array(z.number().min(0).max(6)).min(1, "Please select at least one day."),
});

export type BellFormValues = z.infer<typeof bellFormSchema>;

export const scheduleFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name is too long."),
});

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;