import { useAuth } from "@/contexts/AuthProvider";
import { User, Bell, LogOut, Palette, Edit, ShieldAlert, LifeBuoy, Phone, Building, Briefcase } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { logUserAction } from "@/lib/logger";

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
  const { signOut, user, profile: authProfile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    department: "",
    role: "",
  });
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  useEffect(() => {
    if (authProfile) {
      setProfile({
        first_name: authProfile.first_name || "",
        last_name: authProfile.last_name || "",
        phone_number: authProfile.phone_number || "",
        department: authProfile.department || "",
        role: authProfile.role || "",
      });
    }
  }, [authProfile]);

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    logUserAction(user, 'UPDATE_PROFILE', { updatedFields: Object.keys(profile) });
    const toastId = showLoading("Updating profile...");
    try {
      await updateProfile(profile);
      dismissToast(toastId);
      showSuccess("Profile updated successfully!");
      setIsProfileDialogOpen(false);
    } catch (error) {
      dismissToast(toastId);
      showError("Failed to update profile.");
    }
  };

  const handleDeleteAccount = async () => {
    logUserAction(user, 'DELETE_ACCOUNT');
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

  const handleNotificationChange = async (key: 'push_notifications_enabled' | 'email_summary_enabled', value: boolean) => {
    logUserAction(user, 'UPDATE_NOTIFICATION_SETTINGS', { setting: key, value });
    const toastId = showLoading("Updating notification settings...");
    try {
      await updateProfile({ [key]: value });
      dismissToast(toastId);
      showSuccess("Settings updated!");
    } catch (error) {
      dismissToast(toastId);
      showError("Failed to update settings.");
    }
  };

  if (!authProfile) {
    return <SettingsSkeleton />;
  }

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
              <p className="font-semibold">{`${authProfile?.first_name || ""} ${authProfile?.last_name || ""}`.trim() || user?.email}</p>
              <p className="text-sm text-muted-foreground">{`${authProfile?.role || "User"} - ${authProfile?.department || "No Department"}`}</p>
            </div>
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogTrigger asChild><Button variant="outline" className="w-full"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button></DialogTrigger>
              <DialogContent className="glass-card">
                <DialogHeader><DialogTitle>Edit Profile</DialogTitle><DialogDescription>Update your personal and professional information.</DialogDescription></DialogHeader>
                <form onSubmit={handleProfileUpdate} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" value={profile.first_name || ''} onChange={(e) => setProfile({...profile, first_name: e.target.value})} className="glass-input" /></div>
                    <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" value={profile.last_name || ''} onChange={(e) => setProfile({...profile, last_name: e.target.value})} className="glass-input" /></div>
                  </div>
                  <div><Label htmlFor="phone">Phone Number</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="phone" type="tel" value={profile.phone_number || ''} onChange={(e) => setProfile({...profile, phone_number: e.target.value})} className="pl-10 glass-input" /></div></div>
                  <div><Label htmlFor="department">Department</Label><div className="relative"><Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="department" value={profile.department || ''} onChange={(e) => setProfile({...profile, department: e.target.value})} className="pl-10 glass-input" /></div></div>
                  <div><Label htmlFor="role">Role</Label><div className="relative"><Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="role" value={profile.role || ''} onChange={(e) => setProfile({...profile, role: e.target.value})} className="pl-10 glass-input" /></div></div>
                  <DialogFooter><Button type="submit" className="gradient-button">Save Changes</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
            <div className="flex items-center justify-between"><Label htmlFor="push-notifications">Push Notifications</Label><Switch id="push-notifications" checked={authProfile.push_notifications_enabled ?? true} onCheckedChange={(c) => handleNotificationChange('push_notifications_enabled', c)} /></div>
            <div className="flex items-center justify-between"><Label htmlFor="email-summary">Email Summary</Label><Switch id="email-summary" checked={authProfile.email_summary_enabled ?? true} onCheckedChange={(c) => handleNotificationChange('email_summary_enabled', c)} /></div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger>
            <div className="flex items-center gap-3"><LifeBuoy className="h-5 w-5" /> Help & Support</div>
          </AccordionTrigger>
          <AccordionContent className="p-4 space-y-2">
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/app/support')}>Contact Support</Button>
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
                <Button variant="destructive" className="w-full">Delete Account</Button>
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