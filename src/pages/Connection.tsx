import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wifi, CheckCircle, XCircle, Loader, RefreshCw, WifiOff, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { showLoading, dismissToast, showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthProvider";

type Status = "connected" | "failed" | "pending" | "disconnected";

const Connection = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("disconnected");
  const [espIp, setEspIp] = useState<string>("");
  const [ssid, setSsid] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [anonKey, setAnonKey] = useState<string>(import.meta.env.VITE_SUPABASE_ANON_KEY || "");
  const [deviceIp, setDeviceIp] = useState<string | null>(null);

  const getEdgeFunctionUrl = () => {
    const projectId = "tkrgbcfidggxioizvkeq";
    const functionName = "bell-sync";
    return `https://${projectId}.supabase.co/functions/v1/${functionName}`;
  };

  const sendCommandToESP = async (endpoint: string, method: string = "GET", body?: any) => {
    if (!espIp) {
      showError("Please enter the ESP8266 IP address.");
      return null;
    }
    const url = `http://${espIp}/${endpoint}`;
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error sending command to ESP8266 at ${url}:`, error);
      showError(`Failed to communicate with device at ${espIp}. Make sure it's powered on and configured.`);
      return null;
    }
  };

  const handleConnect = async () => {
    if (!ssid || !password || !user?.id || !anonKey) {
      showError("Please fill in all fields: WiFi SSID, Password, and Supabase Anon Key.");
      return;
    }

    const toastId = showLoading("Sending configuration to device...");
    setStatus("pending");

    const edgeFunctionUrl = getEdgeFunctionUrl();

    const response = await sendCommandToESP("config", "POST", {
      ssid: ssid,
      password: password,
      edge_url: edgeFunctionUrl,
      user_id: user.id,
      anon_key: anonKey,
    });

    dismissToast(toastId);
    if (response) {
      showSuccess("Configuration sent. Device attempting to connect...");
      setTimeout(handleRefreshStatus, 5000); 
    } else {
      setStatus("failed");
      showError("Failed to send configuration to device.");
    }
  };

  const handleRefreshStatus = async () => {
    const toastId = showLoading("Refreshing device status...");
    const response = await sendCommandToESP("status");
    dismissToast(toastId);

    if (response) {
      if (response.status === "connected") {
        setStatus("connected");
        setDeviceIp(response.ip);
        showSuccess(`Device connected! IP: ${response.ip}`);
      } else {
        setStatus("disconnected");
        setDeviceIp(null);
        showError("Device is not connected to WiFi.");
      }
    } else {
      setStatus("disconnected");
      setDeviceIp(null);
    }
  };

  const handleDisconnect = async () => {
    const toastId = showLoading("Disconnecting device...");
    const response = await sendCommandToESP("disconnect", "POST");
    dismissToast(toastId);

    if (response) {
      setStatus("disconnected");
      setDeviceIp(null);
      showSuccess("Device disconnected.");
    } else {
      showError("Failed to send disconnect command.");
    }
  };

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
            {deviceIp && <CardDescription>IP: {deviceIp}</CardDescription>}
            
            <div className="space-y-4 w-full mt-4">
              <div>
                <Label htmlFor="esp-ip" className="text-left block mb-2">ESP8266 IP Address</Label>
                <Input 
                  id="esp-ip" 
                  placeholder="e.g., 192.168.1.100" 
                  value={espIp} 
                  onChange={(e) => setEspIp(e.target.value)} 
                  className="bg-white/50 dark:bg-black/20 border-gray-300/50 dark:border-gray-700/50" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The IP of your ESP8266 on your local network. Check your router's device list if unsure.
                </p>
              </div>
              <div>
                <Label htmlFor="ssid" className="text-left block mb-2">WiFi SSID</Label>
                <Input 
                  id="ssid" 
                  placeholder="Enter your WiFi name" 
                  value={ssid} 
                  onChange={(e) => setSsid(e.target.value)} 
                  className="bg-white/50 dark:bg-black/20 border-gray-300/50 dark:border-gray-700/50" 
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-left block mb-2">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter WiFi password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="bg-white/50 dark:bg-black/20 border-gray-300/50 dark:border-gray-700/50" 
                />
              </div>
              <div>
                <Label htmlFor="anon-key" className="text-left block mb-2">Supabase Anon Key</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="anon-key" 
                    type="password"
                    placeholder="Enter your Supabase public anon key" 
                    value={anonKey} 
                    onChange={(e) => setAnonKey(e.target.value)} 
                    className="pl-10 bg-white/50 dark:bg-black/20 border-gray-300/50 dark:border-gray-700/50" 
                  />
                </div>
              </div>
              <Button className="w-full gradient-button" onClick={handleConnect}>Connect to Device</Button>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="w-full" onClick={handleRefreshStatus}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
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