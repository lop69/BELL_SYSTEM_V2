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
    <div className="flex flex-col min-h-screen">
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="flex-1 flex-col gap-4 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <nav className="sticky bottom-0 left-0 right-0 h-16 border-t bg-background/95 backdrop-blur-sm">
        <div className="flex justify-around h-full">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-full text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )
              }
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;