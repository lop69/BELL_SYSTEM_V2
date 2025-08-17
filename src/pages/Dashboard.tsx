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
  const [todaySchedule, setTodaySchedule] = useState<Bell[]>([]);
  const [nextBell, setNextBell] = useState<{ time: Date; label: string } | null>(null);
  const [countdown, setCountdown] = useState('00:00:00');
  const [isTestBellActive, setIsTestBellActive] = useState(false);
  const timeZone = "Asia/Kolkata";

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user) return;
      
      // JS getDay(): Sun=0, Mon=1... Sat=6. Assuming DB days_of_week follows this.
      const todayIndex = new Date().getDay();

      const { data, error } = await supabase
        .from('bells')
        .select('*')
        .eq('user_id', user.id)
        .contains('days_of_week', [todayIndex]);

      if (error) {
        showError("Failed to fetch today's schedule.");
        console.error(error);
      } else {
        const sortedSchedule = data.sort((a, b) => a.time.localeCompare(b.time));
        setTodaySchedule(sortedSchedule);
      }
    };
    fetchSchedule();
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const upcomingBell = todaySchedule
        .map(bell => {
          const [hours, minutes] = bell.time.split(':').map(Number);
          const bellTime = new Date(now);
          bellTime.setHours(hours, minutes, 0, 0);
          return { time: bellTime, label: bell.label };
        })
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
  }, [todaySchedule]);

  const handleTestBell = async () => {
    if (!user) {
      showError("Please log in to test the bell.");
      return;
    }

    setIsTestBellActive(true);
    const toastId = showLoading("Activating test bell for 30 seconds...");

    try {
      const { data: existingBell } = await supabase
        .from('test_bells')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingBell) {
        await supabase
          .from('test_bells')
          .update({ is_active: true, triggered_at: new Date().toISOString() })
          .eq('id', existingBell.id);
      } else {
        await supabase
          .from('test_bells')
          .insert({ user_id: user.id, is_active: true, triggered_at: new Date().toISOString() });
      }

      showSuccess("Test bell activated!");

      setTimeout(async () => {
        try {
          await supabase
            .from('test_bells')
            .update({ is_active: false })
            .eq('user_id', user.id);
          showSuccess("Test bell deactivated.");
        } catch (error) {
          showError("Failed to deactivate test bell.");
        } finally {
          dismissToast(toastId);
          setIsTestBellActive(false);
        }
      }, 30000);
    } catch (error) {
      dismissToast(toastId);
      showError("Failed to activate test bell.");
      setIsTestBellActive(false);
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
              <p className="text-6xl font-bold text-primary tracking-tight">
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
              <p className="text-4xl font-bold text-primary tracking-tight">{countdown}</p>
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
              <Button variant="ghost" className="flex flex-col h-auto" onClick={handleTestBell} disabled={isTestBellActive}>
                <BellRing className={`h-6 w-6 mb-1 ${isTestBellActive ? 'text-yellow-500 animate-pulse' : 'text-green-500'}`} />
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
            <CardContent className="space-y-3 text-sm">
              {todaySchedule.length > 0 ? todaySchedule.map(bell => {
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
              }) : (
                <p className="text-muted-foreground text-center p-4">No bells scheduled for today.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;