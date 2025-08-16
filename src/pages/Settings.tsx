import { useAuth } from "@/contexts/AuthProvider";
import { User, Bell, LogOut, Palette, Building } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Settings = () => {
  const { signOut, user, isGuest } = useAuth();

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings.</p>
      </div>
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" /> Account
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 p-2">
            <div className="rounded-lg border p-4">
              <p className="font-semibold">{isGuest ? "Guest User" : user?.email}</p>
              <p className="text-sm text-muted-foreground">
                {isGuest ? "Viewing in demo mode" : "Standard Account"}
              </p>
            </div>
            <Button variant="destructive" className="w-full" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5" /> Appearance
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 flex items-center justify-between">
            <Label htmlFor="theme-mode">Toggle Light/Dark Mode</Label>
            <ThemeToggle />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" /> Notifications
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <Switch id="push-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-summary">Email Summary</Label>
              <Switch id="email-summary" checked />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Settings;