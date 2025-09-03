import { ShieldAlert } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthProvider";
import { logUserAction } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";

const DangerZone = () => {
  const { user, signOut } = useAuth();

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

  return (
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
  );
};

export default DangerZone;