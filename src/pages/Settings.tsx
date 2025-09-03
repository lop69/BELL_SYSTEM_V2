import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthProvider";
import ProfileSettings from "./settings/ProfileSettings";
import AppearanceSettings from "./settings/AppearanceSettings";
import NotificationSettings from "./settings/NotificationSettings";
import DangerZone from "./settings/DangerZone";
import HelpAndSupportSettings from "./settings/HelpAndSupportSettings";

const SettingsSkeleton = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-1/2 mt-2" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  </div>
);

const Settings = () => {
  const { profile } = useAuth();

  if (!profile) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings.</p>
      </div>
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <ProfileSettings />
        <AppearanceSettings />
        <NotificationSettings />
        <HelpAndSupportSettings />
        <DangerZone />
      </Accordion>
    </div>
  );
};

export default Settings;