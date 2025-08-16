import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wifi, CheckCircle, XCircle, Loader, RefreshCw, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { showLoading, dismissToast, showSuccess, showError } from "@/utils/toast";

type Status = "connected" | "failed" | "pending" | "disconnected";

const Connection = () => {
  const [status, setStatus] = useState<Status>("pending");

  const handleConnect = () => {
    const toastId = showLoading("Connecting to device...");
    setStatus("pending");
    setTimeout(() => {
      dismissToast(toastId);
      if (Math.random() > 0.3) {
        setStatus("connected");
        showSuccess("Device connected successfully!");
      } else {
        setStatus("failed");
        showError("Failed to connect to device.");
      }
    }, 2000);
  };

  const handleDisconnect = () => {
    setStatus("disconnected");
    showSuccess("Device disconnected.");
  }

  const StatusIndicator = () => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed': return <XCircle className="h-16 w-16 text-red-500" />;
      case 'pending': return <Loader className="h-16 w-16 text-muted-foreground animate-spin" />;
      case 'disconnected': return <WifiOff className="h-16 w-16 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Device Connection</h1>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="glass-card text-center p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wifi />
              <span>ESP8266 Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 p-0">
            <StatusIndicator />
            <p className="font-semibold capitalize">{status}</p>
            {status === 'connected' && <CardDescription>IP: 192.168.1.101</CardDescription>}
            
            <div className="space-y-4 w-full mt-4">
              <div>
                <Label htmlFor="ssid" className="text-left block mb-2">WiFi SSID</Label>
                <Input id="ssid" placeholder="Enter your WiFi name" className="bg-white/50 dark:bg-black/20 border-gray-300/50 dark:border-gray-700/50" />
              </div>
              <div>
                <Label htmlFor="password" className="text-left block mb-2">Password</Label>
                <Input id="password" type="password" placeholder="Enter WiFi password" className="bg-white/50 dark:bg-black/20 border-gray-300/50 dark:border-gray-700/50" />
              </div>
              <Button className="w-full gradient-button" onClick={handleConnect}>Connect to Device</Button>
              <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={handleConnect}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
                <Button variant="destructive" className="w-full" onClick={handleDisconnect}><WifiOff className="mr-2 h-4 w-4" /> Disconnect</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Connection;