import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Calendar, HardDrive, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, Transition } from "framer-motion";
import Header from "./Header";
import { useEffect, useRef, useState } from "react";
import { useAuth, fetchProfile } from "@/contexts/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { fetchScheduleGroups } from "@/pages/Schedules";
import { fetchBellsForSchedule } from "@/components/BellManagementDialog";
import { fetchDevices } from "@/pages/Devices";
import { fetchDashboardData } from "@/pages/Dashboard";
import { ScheduleGroup } from "@/types/database";

const navItems = [
  { to: "/app", icon: Home, label: "Dashboard", roles: ['Admin', 'HOD', 'Student'] },
  { to: "/app/schedules", icon: Calendar, label: "Schedule", roles: ['Admin', 'HOD'] },
  { to: "/app/devices", icon: HardDrive, label: "Devices", roles: ['Admin', 'HOD'] },
  { to: "/app/settings", icon: Settings, label: "Settings", roles: ['Admin', 'HOD', 'Student'] },
];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

const transition: Transition = {
  x: { type: "spring", stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
};

const Layout = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [direction, setDirection] = useState(0);
  const prevIndexRef = useRef(0);

  const accessibleNavItems = navItems.filter(item => 
    profile?.role && item.roles.includes(profile.role)
  );

  const getActiveIndex = (pathname: string) => {
    const reversedNavItems = [...accessibleNavItems].reverse();
    const reversedIndex = reversedNavItems.findIndex(item => pathname.startsWith(item.to));
    if (reversedIndex !== -1) {
      return accessibleNavItems.length - 1 - reversedIndex;
    }
    if (pathname.startsWith('/app')) return 0;
    return -1;
  };
  
  useEffect(() => {
    const prefetchAllData = async () => {
      if (!user) return;

      // --- Aggressive Pre-fetching Strategy ---

      // 1. Prefetch primary data that doesn't have dependencies
      const primaryDataPromise = Promise.all([
        queryClient.prefetchQuery({ 
          queryKey: ['dashboardData', user.id], 
          queryFn: () => fetchDashboardData(user.id) 
        }),
        queryClient.prefetchQuery({ 
          queryKey: ['devices'], 
          queryFn: fetchDevices 
        }),
        queryClient.prefetchQuery({
          queryKey: ['profile', user.id],
          queryFn: () => fetchProfile(user.id),
        })
      ]);

      // 2. Prefetch schedule groups, and once complete, prefetch bells for ALL schedules
      const schedulesAndBellsPromise = queryClient.prefetchQuery({ 
        queryKey: ['scheduleGroups'], 
        queryFn: fetchScheduleGroups 
      }).then(() => {
        const scheduleGroups = queryClient.getQueryData<ScheduleGroup[]>(['scheduleGroups']);
        if (scheduleGroups && scheduleGroups.length > 0) {
          const bellPromises = scheduleGroups.flatMap(group => 
            group.schedules.map(schedule => 
              queryClient.prefetchQuery({
                queryKey: ['bells', schedule.id],
                queryFn: () => fetchBellsForSchedule(schedule.id),
              })
            )
          );
          return Promise.all(bellPromises);
        }
      });

      // Wait for all pre-fetching to be initiated
      await Promise.all([primaryDataPromise, schedulesAndBellsPromise]);
    };

    prefetchAllData();
  }, [queryClient, user]);

  useEffect(() => {
    const currentIndex = getActiveIndex(location.pathname);
    if (currentIndex > prevIndexRef.current) {
      setDirection(1);
    } else if (currentIndex < prevIndexRef.current) {
      setDirection(-1);
    }
    prevIndexRef.current = currentIndex;
  }, [location.pathname, accessibleNavItems]);

  return (
    <div className="h-full w-full overflow-hidden">
      <Header />
      <AnimatePresence initial={false} custom={direction}>
        <motion.main
          key={location.pathname}
          className="h-full overflow-y-auto p-4 pt-20 pb-24"
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="absolute bottom-0 left-0 right-0 h-20 glass-surface border-t flex-shrink-0 pt-2 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex justify-around h-full">
          {accessibleNavItems.map((item) => (
            <motion.div key={item.to} className="w-full h-full" whileTap={{ scale: 0.95 }}>
              <NavLink
                to={item.to}
                end={item.to === "/app"}
                className="group w-full h-full"
              >
                {({ isActive }) => (
                  <div
                    className="flex flex-col items-center justify-center w-full h-full text-xs relative"
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 mb-1 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-slate-600 dark:text-slate-400 group-hover:text-primary"
                      )}
                    />
                    <span
                      className={cn(
                        "transition-colors",
                        isActive
                          ? "font-semibold text-primary"
                          : "text-slate-600 dark:text-slate-400 group-hover:text-primary"
                      )}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        className="absolute bottom-1.5 h-1 w-1 bg-primary rounded-full soft-glow"
                        layoutId="active-indicator"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                )}
              </NavLink>
            </motion.div>
          ))}
        </div>
      </motion.nav>
    </div>
  );
};

export default Layout;