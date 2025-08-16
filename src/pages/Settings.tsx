import { useAuth } from "@/contexts/AuthProvider";
import { ChevronRight, User, Bell, LogOut, Palette } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";

const Settings = () => {
  const { signOut, user, isGuest } = useAuth();

  const settingsItems = [
    { icon: User, label: "Profile" },
    { icon: Bell, label: "Notifications" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-4xl font-bold text-primary">Settings</h1>
      
      <motion.div className="glass-card p-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
        <p className="font-semibold text-lg">{isGuest ? "Guest User" : user?.email}</p>
        <p className="text-sm text-muted-foreground">{isGuest ? "Viewing in demo mode" : "Standard Account"}</p>
      </motion.div>

      <motion.div className="glass-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
        <ul className="divide-y divide-white/20">
          {settingsItems.map((item) => (
            <li key={item.label} className="flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
              <div className="flex items-center space-x-4">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div className="glass-card p-4 flex items-center justify-between" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center space-x-4">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Appearance</span>
        </div>
        <ThemeToggle />
      </motion.div>

      <motion.div className="glass-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center space-x-4 p-4 cursor-pointer text-red-500 hover:bg-red-500/10 transition-colors" onClick={signOut}>
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;