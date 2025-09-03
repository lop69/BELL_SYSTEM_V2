import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatInTimeZone } from "date-fns-tz";

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
  },
};

interface DashboardBell {
  schedule_name: string;
  bell_id: string;
  bell_time: string;
  bell_label: string;
}

interface TodaysScheduleProps {
  scheduleBells: DashboardBell[];
  currentTime: Date;
}

const TodaysSchedule = ({ scheduleBells, currentTime }: TodaysScheduleProps) => {
  const navigate = useNavigate();
  const scheduleName = scheduleBells.length > 0 ? scheduleBells[0].schedule_name : "No Active Schedule";
  const timeZone = "Asia/Kolkata";

  return (
    <motion.div variants={itemVariants}>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Today's Schedule: {scheduleName}</span>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {scheduleBells.length > 0 ? (
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              {scheduleBells.map(bell => {
                const [hours, minutes] = bell.bell_time.split(':').map(Number);
                const bellDate = new Date(currentTime);
                bellDate.setHours(hours, minutes, 0, 0);
                const isPast = currentTime > bellDate;
                return (
                  <motion.div key={bell.bell_id} className="flex items-center gap-4 relative" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                    <div className={`absolute -left-5 h-2 w-2 rounded-full ${isPast ? 'bg-green-500' : 'bg-primary'}`}></div>
                    <span className={`font-semibold w-20 ${isPast ? 'text-muted-foreground line-through' : 'text-primary'}`}>{formatInTimeZone(bellDate, timeZone, 'hh:mm a')}</span>
                    <p className={isPast ? 'text-muted-foreground line-through' : ''}>{bell.bell_label}</p>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-4 flex flex-col items-center gap-4">
              <Calendar className="h-12 w-12 text-primary/30" />
              <p className="text-muted-foreground">No bells scheduled for today.</p>
              <Button onClick={() => navigate('/app/schedules')}><Plus className="mr-2 h-4 w-4" /> Create a Schedule</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TodaysSchedule;