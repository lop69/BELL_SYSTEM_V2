import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Calendar, Wifi, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const Layout = () => {
  const location = useLocation();
  const navItems = [
    { to: "/app", icon: Home, label: "Dashboard" },
    { to: "/app/schedules", icon: Calendar, label: "Schedule" },
    { to: "/app/connection", icon: Wifi, label: "Connection" },
    { to: "/app/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen main-gradient">
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="pb-24"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <nav className="fixed bottom-4 left-4 right-4 h-20 glass-card">
        <div className="flex justify-around h-full">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-full text-sm transition-colors relative",
                  isActive ? "text-cyan-500" : "text-muted-foreground hover:text-primary"
                )
              }
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;