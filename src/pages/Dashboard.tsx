import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Edit } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";

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
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Next Bell In
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-6xl font-bold text-primary tracking-tight">00:45:12</p>
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
              <div className="flex items-center gap-4">
                <span className="font-semibold text-primary">09:00 AM</span>
                <p>Morning Assembly</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-primary">11:00 AM</span>
                <p>Lecture End</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-primary">01:00 PM</span>
                <p>Lunch Break</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;