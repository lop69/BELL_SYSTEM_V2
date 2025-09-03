import { Bell } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthProvider";
import { logUserAction } from "@/lib/logger";

const NotificationSettings = () => {
  const { profile, updateProfile, user } = useAuth();

  const handleNotificationChange = (key: 'push_notifications_enabled' | 'email_summary_enabled', value: boolean) => {
    logUserAction(user, 'UPDATE_NOTIFICATION_SETTINGS', { setting: key, value });
    updateProfile({ [key]: value });
  };

  return (
    <AccordionItem value="item-3">
      <AccordionTrigger>
        <div className="flex items-center gap-3"><Bell className="h-5 w-5" /> Notifications</div>
      </AccordionTrigger>
      <AccordionContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="push-notifications">Push Notifications</Label>
          <Switch id="push-notifications" checked={profile?.push_notifications_enabled ?? true} onCheckedChange={(c) => handleNotificationChange('push_notifications_enabled', c)} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="email-summary">Email Summary</Label>
          <Switch id="email-summary" checked={profile?.email_summary_enabled ?? true} onCheckedChange={(c) => handleNotificationChange('email_summary_enabled', c)} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default NotificationSettings;