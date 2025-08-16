import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Bell, Wifi, WifiOff } from "lucide-react";

const devices = [
  { name: "Main Entrance Bell", status: "Online", id: "BELL-001" },
  { name: "Library Bell", status: "Online", id: "BELL-002" },
  { name: "Gymnasium Bell", status: "Offline", id: "BELL-003" },
  { name: "Cafeteria Bell", status: "Online", id: "BELL-004" },
];

const Devices = () => {
  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Devices</h1>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {devices.map((device) => (
          <Card key={device.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {device.name}
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {device.status === "Online" ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    device.status === "Online"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {device.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{device.id}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Devices;