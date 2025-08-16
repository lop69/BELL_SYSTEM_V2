import { NavLink } from "react-router-dom";
import { Home, Calendar, Wifi, Settings, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/app", icon: Home, label: "Dashboard" },
  { to: "/app/schedules", icon: Calendar, label: "Schedule" },
  { to: "/app/connection", icon: Wifi, label: "Connection" },
  { to: "/app/settings", icon: Settings, label: "Settings" },
];

const Sidebar = () => {
  return (
    <aside className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-6">
          <NavLink to="/app" className="flex items-center gap-2 font-semibold">
            <BellRing className="h-6 w-6 text-primary" />
            <span>Scheduler</span>
          </NavLink>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-4 text-sm font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;