import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Bell, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const Layout = () => {
  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/bells", icon: Bell, label: "Bells" },
    { to: "/schedules", icon: Calendar, label: "Schedules" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-background">
      <main className="flex-grow pb-20">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t md:max-w-md md:left-1/2 md:-translate-x-1/2 md:rounded-t-lg">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
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