import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Plus, Wifi } from "lucide-react";
import { motion } from "framer-motion";

const Dashboard = () => {
  return (
    <div className="p-6 space-y-8">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-4xl font-bold text-primary">Good Morning, Science Dept.</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening today.</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Next Bell Countdown</span>
                <Bell className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-6xl font-bold text-center text-primary tracking-widest">00:45:12</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button className="w-full gradient-button"><Plus className="h-4 w-4 mr-2" /> Add Bell</Button>
              <Button className="w-full" variant="outline">Edit Schedule</Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="md:col-span-2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Today's Schedule</span>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>09:00 AM - Morning Assembly</p>
              <p>11:00 AM - Lecture End</p>
              <p>01:00 PM - Lunch Break</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;