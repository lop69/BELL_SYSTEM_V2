import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { User, Edit, LogOut, Loader2, Phone, Building, Briefcase } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const profileFormSchema = z.object({
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  phone_number: z.string().optional(),
  department: z.string().min(1, "Department is required."),
  role: z.string().min(1, "Role is required."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfileSettings = () => {
  const { signOut, user, profile, updateProfile } = useAuth();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone_number: "",
      department: "",
      role: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone_number: profile.phone_number || "",
        department: profile.department || "",
        role: profile.role || "",
      });
    }
  }, [profile, form]);

  const handleProfileUpdate = (values: ProfileFormValues) => {
    updateProfile(values);
    setIsProfileDialogOpen(false);
  };

  return (
    <AccordionItem value="item-1">
      <AccordionTrigger>
        <div className="flex items-center gap-3"><User className="h-5 w-5" /> Account</div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 p-2">
        <div className="rounded-lg border p-4">
          <p className="font-semibold">{`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || user?.email}</p>
          <p className="text-sm text-muted-foreground">{`${profile?.role || "User"} - ${profile?.department || "No Department"}`}</p>
        </div>
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogTrigger asChild><Button variant="outline" className="w-full"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button></DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader><DialogTitle>Edit Profile</DialogTitle><DialogDescription>Update your personal and professional information.</DialogDescription></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProfileUpdate)} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="first_name" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} className="glass-input" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="last_name" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} className="glass-input" /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="phone_number" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input type="tel" {...field} className="pl-10 glass-input" /></FormControl></div><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>Department</FormLabel><div className="relative"><Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input {...field} className="pl-10 glass-input" /></FormControl></div><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><div className="relative"><Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input {...field} className="pl-10 glass-input" /></FormControl></div><FormMessage /></FormItem>)} />
                <DialogFooter>
                  <Button type="submit" className="gradient-button" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <Button variant="destructive" className="w-full" onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Sign Out</Button>
      </AccordionContent>
    </AccordionItem>
  );
};

export default ProfileSettings;