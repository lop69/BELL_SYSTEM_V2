import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess } from "@/utils/toast";

const initialSchedules = {
  "1st Year": [
    { id: 1, time: "09:00", label: "Morning Assembly" },
    { id: 2, time: "11:00", label: "Lecture End" },
    { id: 3, time: "13:00", label: "Lunch Break" },
  ],
  "2nd Year": [{ id: 4, time: "10:00", label: "Lab Session Start" }],
  "3rd Year": [{ id: 5, time: "16:00", label: "End of Day" }],
};

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Schedules = () => {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddBell = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const year = formData.get("year") as string;
    const newBell = {
      id: Date.now(),
      time: formData.get("time") as string,
      label: formData.get("label") as string,
    };

    if (year && newBell.time && newBell.label) {
      setSchedules((prev) => ({
        ...prev,
        [year]: [...(prev[year as keyof typeof prev] || []), newBell],
      }));
      showSuccess(`Bell added to ${year} schedule!`);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="pb-16">
      <Tabs defaultValue="1st Year" className="space-y-4">
        <div className="flex items-center">
          <TabsList>
            {Object.keys(schedules).map((year) => (
              <TabsTrigger key={year} value={year}>{year}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        {Object.entries(schedules).map(([year, bells]) => (
          <TabsContent value={year} key={year}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{year} Schedule</CardTitle>
                <CardDescription>
                  Manage the bell schedule for all {year.toLowerCase()} students.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bells.length > 0 ? bells.map((bell) => (
                  <div
                    key={bell.id}
                    className="flex items-center justify-between rounded-2xl border p-3 bg-background/50"
                  >
                    <div>
                      <p className="font-semibold">{bell.label}</p>
                      <p className="text-sm text-muted-foreground">{bell.time}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                )) : <p className="text-muted-foreground text-center p-4">No bells scheduled.</p>}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gradient-button fixed bottom-20 right-4 h-16 w-16 rounded-full shadow-lg z-10">
            <Plus className="h-8 w-8" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md glass-card">
          <DialogHeader>
            <DialogTitle>Add New Bell</DialogTitle>
            <DialogDescription>
              Set the time, label, and recurrence for the new bell.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddBell} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">Year</Label>
              <Select name="year" required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">Time</Label>
              <Input id="time" name="time" type="time" required className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">Label</Label>
              <Input id="label" name="label" placeholder="e.g., Lunch Break" required className="col-span-3" />
            </div>
            <div>
              <Label className="mb-3 block text-center">Repeat on</Label>
              <div className="flex justify-center items-center gap-2">
                {daysOfWeek.map(day => (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <Checkbox id={`day-${day}`} />
                    <Label htmlFor={`day-${day}`} className="text-xs">{day}</Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="gradient-button w-full">Save Bell</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedules;