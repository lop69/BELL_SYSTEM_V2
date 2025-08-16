import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Bell, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const Layout = () => {
  const location = useLocation();
  const navItems = [
    { to: "/app", icon: Home, label: "Home" },
    { to: "/app/devices", icon: Bell, label: "Devices" },
    { to: "/app/schedules", icon: Calendar, label: "Schedules" },
    { to: "/app/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-background">
      <motion.main
        className="flex-grow pb-20"
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Outlet />
      </motion.main>
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t md:max-w-md md:left-1/2 md:-translate-x-1/2 md:rounded-t-lg">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-full pt-2 pb-1 text-sm transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
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