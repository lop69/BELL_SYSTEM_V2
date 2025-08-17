import { useAuth } from "@/contexts/AuthProvider";
import { User, Bell, LogOut, Palette, Edit, ShieldAlert, LifeBuoy } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";

const Settings = () => {
  const { signOut, user, isGuest } = useAuth();
  const [profile, setProfile] = useState({ first_name: "", last_name: "" });
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState({ push: false, email: true });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const toastId = showLoading("Updating profile...");
    const { error } = await supabase.from("profiles").update(profile).eq("id", user.id);
    dismissToast(toastId);

    if (error) {
      showError("Failed to update profile.");
    } else {
      showSuccess("Profile updated successfully!");
      setIsProfileDialogOpen(false);
    }
  };

  const handleDeleteAccount = async () => {
    const toastId = showLoading("Deleting your account...");
    try {
      const { error } = await supabase.functions.invoke("delete-user");
      if (error) throw error;
      showSuccess("Account deleted successfully.");
      signOut();
    } catch (error) {
      showError("Failed to delete account. Please try again.");
    } finally {
      dismissToast(toastId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings.</p>
      </div>
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <div className="flex items-center gap-3"><User className="h-5 w-5" /> Account</div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 p-2">
            <div className="rounded-lg border p-4">
              <p className="font-semibold">{isGuest ? "Guest User" : `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || user?.email}</p>
              <p className="text-sm text-muted-foreground">{isGuest ? "Viewing in demo mode" : "Standard Account"}</p>
            </div>
            {!isGuest && (
              <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" className="w-full"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button></DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader><DialogTitle>Edit Profile</DialogTitle><DialogDescription>Update your personal information.</DialogDescription></DialogHeader>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" value={profile.first_name} onChange={(e) => setProfile({...profile, first_name: e.target.value})} className="bg-white/50 dark:bg-black/20" /></div>
                    <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" value={profile.last_name} onChange={(e) => setProfile({...profile, last_name: e.target.value})} className="bg-white/50 dark:bg-black/20" /></div>
                    <DialogFooter><Button type="submit" className="gradient-button">Save Changes</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <Button variant="destructive" className="w-full" onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Sign Out</Button>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>
            <div className="flex items-center gap-3"><Palette className="h-5 w-5" /> Appearance</div>
          </AccordionTrigger>
          <AccordionContent className="p-4 flex items-center justify-between">
            <Label htmlFor="theme-mode">Toggle Light/Dark Mode</Label>
            <ThemeToggle />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>
            <div className="flex items-center gap-3"><Bell className="h-5 w-5" /> Notifications</div>
          </AccordionTrigger>
          <AccordionContent className="p-4 space-y-4">
            <div className="flex items-center justify-between"><Label htmlFor="push-notifications">Push Notifications</Label><Switch id="push-notifications" checked={notifications.push} onCheckedChange={(c) => setNotifications({...notifications, push: c})} /></div>
            <div className="flex items-center justify-between"><Label htmlFor="email-summary">Email Summary</Label><Switch id="email-summary" checked={notifications.email} onCheckedChange={(c) => setNotifications({...notifications, email: c})} /></div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger>
            <div className="flex items-center gap-3"><LifeBuoy className="h-5 w-5" /> Help & Support</div>
          </AccordionTrigger>
          <AccordionContent className="p-4 space-y-2">
            <Button variant="link" className="p-0 h-auto">Contact Support</Button>
            <Button variant="link" className="p-0 h-auto">FAQs</Button>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-5">
          <AccordionTrigger>
            <div className="flex items-center gap-3 text-red-500"><ShieldAlert className="h-5 w-5" /> Danger Zone</div>
          </AccordionTrigger>
          <AccordionContent className="p-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isGuest}>Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete your account and remove your data from our servers.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Settings;