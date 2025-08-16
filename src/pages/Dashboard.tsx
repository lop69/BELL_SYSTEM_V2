import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Bell, Calendar, CheckCircle } from "lucide-react";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Home</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's your system overview.
        </p>
      </div>
      <motion.div
        className="grid gap-4 md:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>System Status</span>
              </CardTitle>
              <CardDescription>Overall health of the bell system</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-lg font-semibold">All Systems Operational</p>
                <p className="text-sm text-muted-foreground">No issues detected.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Active Devices</span>
              </CardTitle>
              <CardDescription>Bells currently online</CardDescription>
            </CardHeader>
            <CardContent className="flex items-baseline space-x-1">
              <p className="text-3xl font-bold">3</p>
              <p className="text-muted-foreground">/ 4 online</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Upcoming Schedule</span>
            </CardTitle>
            <CardDescription>Next scheduled ring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Class Change Bell</p>
                <p className="text-sm text-muted-foreground">Today at 10:50 AM</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Main Campus</p>
                <p className="text-sm text-muted-foreground">All Bells</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;