import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Calendar, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";

const schedules = [
  {
    name: "Weekday Classes",
    time: "8:00 AM - 3:00 PM",
    frequency: "Mon-Fri",
    active: true,
  },
  {
    name: "Assembly Warning",
    time: "10:15 AM",
    frequency: "Fridays",
    active: true,
  },
  {
    name: "Weekend Maintenance",
    time: "12:00 PM",
    frequency: "Saturdays",
    active: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

const Schedules = () => {
  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Schedules</h1>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {schedules.map((schedule) => (
          <motion.div key={schedule.name} variants={itemVariants}>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-secondary p-3 rounded-lg">
                    <Calendar className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{schedule.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {schedule.time} &bull; {schedule.frequency}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={schedule.active ? "default" : "outline"}>
                    {schedule.active ? "Active" : "Inactive"}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Schedules;