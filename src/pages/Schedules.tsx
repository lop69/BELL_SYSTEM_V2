import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Schedules = () => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-primary">Schedule Manager</h1>
      </div>
      <div className="text-center py-20 glass-card">
        <p className="text-muted-foreground">Calendar view and schedule list coming soon!</p>
      </div>
       <Button className="gradient-button fixed bottom-28 right-6 h-16 w-16 rounded-full shadow-lg">
        <Plus className="h-8 w-8" />
      </Button>
    </div>
  );
};

export default Schedules;