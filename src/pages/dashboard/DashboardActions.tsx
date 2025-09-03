import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, BellRing } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { logUserAction } from "@/lib/logger";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
  },
};

const DashboardActions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleTestBell = async () => {
    logUserAction(user, 'TRIGGER_TEST_BELL');
    const toastId = showLoading("Sending test signal...");
    try {
      const { error } = await supabase.functions.invoke("global-test-bell", { method: 'POST' });
      if (error) throw error;
      showSuccess("Test signal sent! Any connected test device should ring.");
    } catch (error) {
      showError("Failed to send test signal. Please try again.");
    } finally {
      dismissToast(toastId);
    }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="glass-card p-4">
        <CardContent className="p-2 flex justify-around items-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-center">
            <button onClick={() => navigate('/app/schedules')} className="group flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 transition-colors">
              <Plus className="h-7 w-7 mb-1 text-sky-500 transition-transform group-hover:scale-110" />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">Add Bell</span>
            </button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-center">
            <button onClick={() => navigate('/app/schedules')} className="group flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors">
              <Edit className="h-7 w-7 mb-1 text-indigo-500 transition-transform group-hover:scale-110" />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">Edit</span>
            </button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-center">
            <button onClick={handleTestBell} className="group flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-green-500/10 hover:bg-green-500/20 transition-colors">
              <BellRing className="h-7 w-7 mb-1 text-green-500 transition-transform group-hover:scale-110" />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">Test Bell</span>
            </button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardActions;