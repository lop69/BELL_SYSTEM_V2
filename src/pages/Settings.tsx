import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";

const Settings = () => {
  const { signOut } = useAuth();

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-muted-foreground mt-2">
        Manage your profile, devices, and view audit logs.
      </p>
      <Button onClick={signOut} className="mt-6" variant="outline">
        Sign Out
      </Button>
    </div>
  );
};

export default Settings;