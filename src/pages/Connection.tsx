import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, CheckCircle, XCircle, Loader } from "lucide-react";
import { motion } from "framer-motion";

const Connection = () => {
  // Mock status
  const status: "connected" | "failed" | "pending" = "pending";

  const StatusIndicator = () => {
    if (status === 'connected') return <CheckCircle className="h-16 w-16 text-green-500" />;
    if (status === 'failed') return <XCircle className="h-16 w-16 text-red-500" />;
    return <Loader className="h-16 w-16 text-muted-foreground animate-spin" />;
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-4xl font-bold text-primary">Device Connection</h1>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="glass-card text-center p-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Wifi />
              <span>ESP8266 Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <StatusIndicator />
            <p className="font-semibold capitalize">{status}</p>
            <div className="space-y-4 w-full mt-6">
              <div>
                <Label htmlFor="ssid">WiFi SSID</Label>
                <Input id="ssid" placeholder="Enter your WiFi name" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter WiFi password" />
              </div>
              <Button className="w-full gradient-button">Connect to Device</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Connection;