import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Edit, Clock } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { format, differenceInMilliseconds } from "date-fns";

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

// Mock schedule for today
const todaySchedule = [
  { time: "09:00", label: "Morning Assembly" },
  { time: "11:00", label: "Lecture End" },
  { time: "13:00", label: "Lunch Break" },
  { time: "15:00", label: "Lab Session" },
  { time: "17:00", label: "End of Day" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextBell, setNextBell] = useState<{ time: Date; label: string } | null>(null);
  const [countdown, setCountdown] = useState('00:00:00');

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
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-3xl font-bold text-primary">Good Morning,</h1>
        <p className="text-muted-foreground mt-1">Science Department</p>
      </motion.div>

      <motion.div 
        className="flex flex-col gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="glass-card text-center p-6">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                Current Time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-6xl font-bold text-primary tracking-tight">
                {format(currentTime, 'HH:mm:ss')}
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
              {todaySchedule.map(bell => {
                const bellDate = new Date();
                const [hours, minutes] = bell.time.split(':').map(Number);
                bellDate.setHours(hours, minutes);
                
                return (
                  <div key={bell.time} className="flex items-center gap-4">
                    <span className="font-semibold text-primary w-20">
                      {format(bellDate, 'hh:mm a')}
                    </span>
                    <p>{bell.label}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;