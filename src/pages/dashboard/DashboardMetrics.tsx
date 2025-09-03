import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LiveClock from "@/components/LiveClock";
import NextBellCountdown from "@/components/NextBellCountdown";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
  },
};

interface DashboardMetricsProps {
  nextBell: { time: Date; label: string } | null;
}

const DashboardMetrics = ({ nextBell }: DashboardMetricsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <motion.div variants={itemVariants} className="smooth-hover">
        <Card className="glass-card text-center p-6 soft-glow">
          <CardHeader className="p-0 mb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />Current Time (IST)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0"><LiveClock /></CardContent>
        </Card>
      </motion.div>
      <motion.div variants={itemVariants} className="smooth-hover">
        <Card className="glass-card text-center p-6 soft-glow">
          <CardHeader className="p-0 mb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {nextBell ? `Next Bell: ${nextBell.label}` : 'No More Bells Today'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <NextBellCountdown nextBellTime={nextBell?.time || null} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardMetrics;