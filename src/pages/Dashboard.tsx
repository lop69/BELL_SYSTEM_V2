import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Edit, Clock, BellRing } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { differenceInMilliseconds } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Bell } from "@/types/database";

type GroupedSchedule = {
  scheduleName: string;
  bells: Bell[];
};

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
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
      ease: "easeOut",
    },
  },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayGroupedSchedule, setTodayGroupedSchedule] = useState<GroupedSchedule[]>([]);
  const [nextBell, setNextBell] = useState<{ time: Date; label: string } | null>(null);
  const [countdown, setCountdown] = useState('00:00:00');
  const timeZone = "Asia/Kolkata";

  useEffect(() => {
    const fetchFullSchedule = async () => {
      if (!user) return;

      const todayIndex = new Date().getDay();

      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select('id, name')
        .eq('user_id', user.id);

      if (schedulesError) {
        showError("Failed to fetch schedules.");
        return;
      }

      const scheduleIds = schedulesData.map(s => s.id);
      if (scheduleIds.length === 0) {
        setTodayGroupedSchedule([]);
        return;
      }

      const { data: bellsData, error: bellsError } = await supabase
        .from('bells')
        .select('*')
        .in('schedule_id', scheduleIds)
        .contains('days_of_week', [todayIndex])
        .order('time', { ascending: true });

      if (bellsError) {
        showError("Failed to fetch today's bells.");
        return;
      }

      const grouped = schedulesData.map(schedule => ({
        scheduleName: schedule.name,
        bells: bellsData.filter(bell => bell.schedule_id === schedule.id)
      })).filter(group => group.bells.length > 0);

      setTodayGroupedSchedule(grouped);
    };

    fetchFullSchedule();
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const allBells = todayGroupedSchedule.flatMap(g => g.bells);

      const upcomingBell = allBells
        .map(bell => {
          const [hours, minutes] = bell.time.split(':').map(Number);
          const bellTime = new Date(now);
          bellTime.setHours(hours, minutes, 0, 0);
          return { time: bellTime, label: bell.label };
        })
        .sort((a, b) => a.time.getTime() - b.time.getTime())
        .find(bell => bell.time > now);

      setNextBell(upcomingBell || null);

      if (upcomingBell) {
        const diff = differenceInMilliseconds(upcomingBell.time, now);
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
          const minutes = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
          const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
          setCountdown(`${hours}:${minutes}:${seconds}`);
        } else {
          setCountdown('00:00:00');
        }
      } else {
        setCountdown('00:00:00');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [todayGroupedSchedule]);

  const handleTestBell = async () => {
    if (!user) return;
    const toastId = showLoading("Sending test signal...");
    try {
      const { error: activateError } = await supabase
        .from("test_bells")
        .upsert({ user_id: user.id, is_active: true }, { onConflict: 'user_id' });
      if (activateError) throw activateError;

      showSuccess("Test signal sent! The bell should ring shortly.");

      setTimeout(async () => {
        await supabase
          .from("test_bells")
          .update({ is_active: false })
          .eq("user_id", user.id);
      }, 10000);

    } catch (error) {
      showError("Failed to send test signal.");
    } finally {
      dismissToast(toastId);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold text-primary">Good Morning,</h1>
        <p className="text-muted-foreground mt-1">Science Department</p>
      </motion.div>

      <motion.div className="flex flex-col gap-6" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <Card className="glass-card text-center p-6">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                Current Time (IST)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-5xl md:text-6xl font-bold text-primary tracking-tight">
                {formatInTimeZone(currentTime, timeZone, 'HH:mm:ss')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass-card text-center p-6">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {nextBell ? `Next Bell: ${nextBell.label}` : 'No More Bells Today'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-3xl md:text-4xl font-bold text-primary tracking-tight">{countdown}</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="glass-card p-4">
            <CardContent className="p-2 flex justify-around">
              <Button variant="ghost" className="flex flex-col h-auto" onClick={() => navigate('/app/schedules')}>
                <Plus className="h-6 w-6 mb-1 text-sky-500" />
                <span className="text-xs">Add Bell</span>
              </Button>
              <Button variant="ghost" className="flex flex-col h-auto" onClick={() => navigate('/app/schedules')}>
                <Edit className="h-6 w-6 mb-1 text-indigo-500" />
                <span className="text-xs">Edit Schedule</span>
              </Button>
              <Button variant="ghost" className="flex flex-col h-auto" onClick={handleTestBell}>
                <BellRing className="h-6 w-6 mb-1 text-green-500" />
                <span className="text-xs">Test Bell</span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>Today's Schedule</span>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {todayGroupedSchedule.length > 0 ? todayGroupedSchedule.map(group => (
                <div key={group.scheduleName}>
                  <h3 className="font-semibold text-md mb-2 text-primary">{group.scheduleName}</h3>
                  <div className="space-y-3 pl-2 border-l-2">
                    {group.bells.map(bell => {
                      const [hours, minutes] = bell.time.split(':').map(Number);
                      const bellDate = new Date();
                      bellDate.setHours(hours, minutes);
                      
                      return (
                        <div key={bell.id} className="flex items-center gap-4">
                          <span className="font-semibold text-primary w-20">
                            {formatInTimeZone(bellDate, timeZone, 'hh:mm a')}
                          </span>
                          <p>{bell.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )) : (
                <div className="text-center p-4">
                  <p className="text-muted-foreground mb-4">No bells scheduled for today.</p>
                  <Button onClick={() => navigate('/app/schedules')}>
                    <Plus className="mr-2 h-4 w-4" /> Create a Schedule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;