import { Button } from "@/components/ui/button";
import { Plus, MoreVertical } from "lucide-react";
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

const schedules = {
  "1st Year": [
    { time: "09:00 AM", label: "Morning Assembly" },
    { time: "11:00 AM", label: "Lecture End" },
    { time: "01:00 PM", label: "Lunch Break" },
  ],
  "2nd Year": [{ time: "10:00 AM", label: "Lab Session Start" }],
  "3rd Year": [{ time: "04:00 PM", label: "End of Day" }],
};

const Schedules = () => {
  return (
    <div className="pb-16">
      <Tabs defaultValue="1st Year">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="1st Year">1st Year</TabsTrigger>
            <TabsTrigger value="2nd Year">2nd Year</TabsTrigger>
            <TabsTrigger value="3rd Year">3rd Year</TabsTrigger>
          </TabsList>
        </div>
        {Object.entries(schedules).map(([year, bells]) => (
          <TabsContent value={year} key={year}>
            <Card>
              <CardHeader>
                <CardTitle>{year} Schedule</CardTitle>
                <CardDescription>
                  Manage the bell schedule for all {year.toLowerCase()} students.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bells.map((bell) => (
                  <div
                    key={bell.time}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-semibold">{bell.label}</p>
                      <p className="text-sm text-muted-foreground">{bell.time}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="gradient-button fixed bottom-20 right-6 h-16 w-16 rounded-full shadow-lg">
            <Plus className="h-8 w-8" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] glass-card">
          <DialogHeader>
            <DialogTitle>Add New Bell</DialogTitle>
            <DialogDescription>
              Set the time and label for the new bell.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input id="time" type="time" defaultValue="10:00" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">
                Label
              </Label>
              <Input id="label" placeholder="e.g., Lunch Break" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="gradient-button">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedules;