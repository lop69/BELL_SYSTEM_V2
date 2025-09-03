import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardMetrics from "./dashboard/DashboardMetrics";
import DashboardActions from "./dashboard/DashboardActions";
import TodaysSchedule from "./dashboard/TodaysSchedule";

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <motion.div>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-1/3 mt-2" />
    </motion.div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton className="h-24 rounded-3xl" />
      <Skeleton className="h-24 rounded-3xl" />
    </div>
    <Skeleton className="h-20 rounded-3xl" />
    <Skeleton className="h-48 rounded-2xl" />
  </div>
);

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { data: scheduleBells = [], isLoading } = useDashboardData();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const nextBell = useMemo(() => {
    return scheduleBells
      .map(bell => {
        const [hours, minutes] = bell.bell_time.split(':').map(Number);
        const bellTime = new Date();
        bellTime.setHours(hours, minutes, 0, 0);
        return { time: bellTime, label: bell.bell_label };
      })
      .sort((a, b) => a.time.getTime() - b.time.getTime())
      .find(bell => bell.time > currentTime) || null;
  }, [scheduleBells, currentTime]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader />
      <motion.div className="flex flex-col gap-6" variants={containerVariants} initial="hidden" animate="visible">
        <DashboardMetrics nextBell={nextBell} />
        <DashboardActions />
        <TodaysSchedule scheduleBells={scheduleBells} currentTime={currentTime} />
      </motion.div>
    </div>
  );
};

export default Dashboard;