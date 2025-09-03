import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Edit, Clock, BellRing } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { logUserAction } from "@/lib/logger";
import LiveClock from "@/components/LiveClock";
import NextBellCountdown from "@/components/NextBellCountdown";

interface DashboardBell {
  schedule_name: string;
  bell_id: string;
  bell_time: string;
  bell_label: string;
  bell_days_of_week: number[];
}

export const fetchDashboardData = async (userId: string | undefined) => {
  if (!userId) return [];
  const todayIndex = new Date().getDay();
  const { data, error } = await supabase.rpc('get_dashboard_data', {
    p_user_id: userId,
    p_day_of_week: todayIndex
  });
  if (error) throw new Error(error.message);
  return data || [];
};

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 1, 0.5, 1],
    },
  },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, department, profile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: scheduleBells = [], isLoading } = useQuery<DashboardBell[]>({
    queryKey: ['dashboardData', user?.id],
    queryFn: () => fetchDashboardData(user?.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const nextBell = useMemo(() => {
    const upcomingBell = scheduleBells.map(bell => {
      const [hours, minutes] = bell.bell_time.split(':').map(Number);
      const bellTime = new Date();
      bellTime.setHours(hours, minutes, 0, 0);
      return { time: bellTime, label: bell.bell_label };
    }).sort((a, b) => a.time.getTime() - b.time.getTime()).find(bell => bell.time > currentTime);
    
    return upcomingBell || null;
  }, [scheduleBells, currentTime]);

  const handleTestBell = async () => {
    logUserAction(user, 'TRIGGER_TEST_BELL');
    const toastId = showLoading("Sending test signal...");
    try {
      const { error } = await supabase.functions.invoke("global-test-bell", {
        method: 'POST',
      });
      if (error) throw error;
      showSuccess("Test signal sent! Any connected test device should ring.");
    } catch (error) {
      showError("Failed to send test signal. Please try again.");
    } finally {
      dismissToast(toastId);
    }
  };

  if (isLoading) {
    return (
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
        <Card className="glass-card">
          <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4"><Skeleton className="h-8 w-20" /><Skeleton className="h-4 w-1/2" /></div>
            <div className="flex items-center gap-4"><Skeleton className="h-8 w-20" /><Skeleton className="h-4 w-1/2" /></div>
            <div className="flex items-center gap-4"><Skeleton className="h-8 w-20" /><Skeleton className="h-4 w-1/2" /></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scheduleName = scheduleBells.length > 0 ? scheduleBells[0].schedule_name : "No Active Schedule";
  const timeZone = "Asia/Kolkata";

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold text-primary">Good Morning, {profile?.first_name || 'User'}</h1>
        <p className="text-muted-foreground mt-1">{department ? `${department} Department` : "Here's your daily summary."}</p>
      </motion.div>
      <motion.div className="flex flex-col gap-6" variants={containerVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={itemVariants} className="smooth-hover"><Card className="glass-card text-center p-6 soft-glow"><CardHeader className="p-0 mb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2"><Clock className="h-4 w-4" />Current Time (IST)</CardTitle></CardHeader><CardContent className="p-0"><LiveClock /></CardContent></Card></motion.div>
          <motion.div variants={itemVariants} className="smooth-hover"><Card className="glass-card text-center p-6 soft-glow"><CardHeader className="p-0 mb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{nextBell ? `Next Bell: ${nextBell.label}` : 'No More Bells Today'}</CardTitle></CardHeader><CardContent className="p-0"><NextBellCountdown nextBellTime={nextBell?.time || null} /></CardContent></Card></motion.div>
        </div>
        <motion.div variants={itemVariants}>
          <Card className="glass-card p-4">
            <CardContent className="p-2 flex justify-around items-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-center">
                <button onClick={() => navigate('/app/schedules')} className="group flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 transition-colors">
                  <Plus className="h-7 w-7 mb-1 text-sky-500 transition-transform group-hover:scale-110" />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">Add Bell</span>
                </button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-center">
                <button onClick={() => navigate('/app/schedules')} className="group flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors">
                  <Edit className="h-7 w-7 mb-1 text-indigo-500 transition-transform group-hover:scale-110" />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">Edit</span>
                </button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-center">
                <button onClick={handleTestBell} className="group flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-green-500/10 hover:bg-green-500/20 transition-colors">
                  <BellRing className="h-7 w-7 mb-1 text-green-500 transition-transform group-hover:scale-110" />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">Test Bell</span>
                </button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}><Card className="glass-card"><CardHeader><CardTitle className="flex items-center justify-between text-lg"><span>Today's Schedule: {scheduleName}</span><Calendar className="h-5 w-5 text-muted-foreground" /></CardTitle></CardHeader><CardContent className="space-y-4 text-sm">{scheduleBells.length > 0 ? (<div className="space-y-3 pl-4 border-l-2 border-primary/20">{scheduleBells.map(bell => { const [hours, minutes] = bell.bell_time.split(':').map(Number); const bellDate = new Date(currentTime); bellDate.setHours(hours, minutes, 0, 0); const isPast = currentTime > bellDate; return (<motion.div key={bell.bell_id} className="flex items-center gap-4 relative" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}><div className={`absolute -left-5 h-2 w-2 rounded-full ${isPast ? 'bg-green-500' : 'bg-primary'}`}></div><span className={`font-semibold w-20 ${isPast ? 'text-muted-foreground line-through' : 'text-primary'}`}>{formatInTimeZone(bellDate, timeZone, 'hh:mm a')}</span><p className={isPast ? 'text-muted-foreground line-through' : ''}>{bell.bell_label}</p></motion.div>); })}</div>) : (<div className="text-center p-4 flex flex-col items-center gap-4"><Calendar className="h-12 w-12 text-primary/30" /><p className="text-muted-foreground">No bells scheduled for today.</p><Button onClick={() => navigate('/app/schedules')}><Plus className="mr-2 h-4 w-4" /> Create a Schedule</Button></div>)}</CardContent></Card></motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;