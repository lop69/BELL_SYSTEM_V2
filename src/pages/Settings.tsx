import { useAuth } from "@/contexts/AuthProvider";
import {
  ChevronRight,
  User,
  Bell,
  LogOut,
  Palette,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Settings = () => {
  const { signOut, user, isGuest } = useAuth();

  const settingsItems = [
    { icon: User, label: "Profile", action: () => {} },
    { icon: Bell, label: "Notifications", action: () => {} },
  ];

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="space-y-6">
        <div className="bg-card border rounded-lg p-4">
          <p className="font-semibold">
            {isGuest ? "Guest User" : user?.email}
          </p>
          <p className="text-sm text-muted-foreground">
            {isGuest ? "Viewing in demo mode" : "Standard Account"}
          </p>
        </div>

        <div className="bg-card border rounded-lg">
          <ul className="divide-y">
            {settingsItems.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between p-4 hover:bg-accent cursor-pointer transition-colors"
                onClick={item.action}
              >
                <div className="flex items-center space-x-4">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Appearance</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="bg-card border rounded-lg">
          <div
            className="flex items-center justify-between p-4 hover:bg-accent cursor-pointer text-destructive"
            onClick={signOut}
          >
            <div className="flex items-center space-x-4">
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;