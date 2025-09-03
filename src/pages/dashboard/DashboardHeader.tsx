import { useAuth } from "@/contexts/AuthProvider";
import { motion } from "framer-motion";

const DashboardHeader = () => {
  const { profile } = useAuth();

  return (
    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <h1 className="text-3xl font-bold text-primary">Good Morning, {profile?.first_name || 'User'}</h1>
      <p className="text-muted-foreground mt-1">{profile?.department ? `${profile.department} Department` : "Here's your daily summary."}</p>
    </motion.div>
  );
};

export default DashboardHeader;