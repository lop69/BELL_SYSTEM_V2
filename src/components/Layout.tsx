import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Calendar, Wifi, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Header from "./Header";

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { to: "/app", icon: Home, label: "Dashboard" },
    { to: "/app/schedules", icon: Calendar, label: "Schedule" },
    { to: "/app/connection", icon: Wifi, label: "Connection" },
    { to: "/app/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="flex-1 flex-col gap-4 p-4 overflow-y-auto"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <nav className="h-16 border-t border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-2xl flex-shrink-0">
        <div className="flex justify-around h-full">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-full text-xs transition-colors relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-5 w-5 mb-1" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      className="absolute bottom-1 h-1 w-1 bg-primary rounded-full"
                      layoutId="active-indicator"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;