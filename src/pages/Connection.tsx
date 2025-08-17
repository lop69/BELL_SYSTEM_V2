import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wifi, CheckCircle, XCircle, Loader, RefreshCw, WifiOff, KeyRound, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { showLoading, dismissToast, showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Schedule } from "@/types/database";

type Status = "connected" | "failed" | "pending" | "disconnected";

const Connection = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("disconnected");
  const [espIp, setEspIp] = useState<string>("");
  const [ssid, setSsid] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [deviceName, setDeviceName] = useState<string>("");
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [anonKey] = useState<string>(import.meta.env.VITE_SUPABASE_ANON_KEY || "");
  const [deviceIp, setDeviceIp] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user) return;
      const { data } = await supabase.from("schedules").select("*");
      if (data) setSchedules(data);
    };
    fetchSchedules();
  }, [user]);

  const getEdgeFunctionUrl = () => {
    const projectId = "tkrgbcfidggxioizvkeq";
    return `https://${projectId}.supabase.co/functions/v1/bell-sync`;
  };

  const sendCommandToESP = async (endpoint: string, method: string = "GET", body?: any) => {
    if (!espIp) {
      showError("Please enter the ESP8266 IP address.");
      return null;
    }
    const url = `http://${espIp}/${endpoint}`;
    try {
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      showError(`Failed to communicate with device at ${espIp}. Make sure it's in config mode.`);
      return null;
    }
  };

  const handleConnect = async () => {
    if (!ssid || !password || !user?.id || !anonKey || !selectedSchedule || !deviceName) {
      showError("Please fill in all fields.");
      return;
    }

    const toastId = showLoading("Sending configuration to device...");
    setStatus("pending");

    const response = await sendCommandToESP("config", "POST", {
      ssid, password, anon_key: anonKey,
      edge_url: getEdgeFunctionUrl(),
      schedule_id: selectedSchedule,
    });

    if (response) {
      const { error } = await supabase.from("devices").insert({
        user_id: user.id,
        schedule_id: selectedSchedule,
        device_name: deviceName,
        device_ip: espIp,
        is_connected: true,
        last_seen: new Date().toISOString(),
      });

      dismissToast(toastId);
      if (error) {
        showError("Device configured, but failed to save to database.");
        setStatus("failed");
      } else {
        showSuccess("Device configured and saved!");
        setTimeout(handleRefreshStatus, 5000);
      }
    } else {
      dismissToast(toastId);
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

  const StatusIndicator = () => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed': return <XCircle className="h-16 w-16 text-red-500" />;
      case 'pending': return <Loader className="h-16 w-16 text-muted-foreground animate-spin" />;
      default: return <WifiOff className="h-16 w-16 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Device Connection</h1>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="glass-card text-center p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center justify-center gap-2"><Wifi /><span>ESP8266 Status</span></CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 p-0">
            <StatusIndicator />
            <p className="font-semibold capitalize">{status}</p>
            {deviceIp && <CardDescription>IP: {deviceIp}</CardDescription>}
            
            <div className="space-y-4 w-full mt-4 text-left">
              <div>
                <Label htmlFor="schedule-select">Assign to Year/Schedule</Label>
                <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                  <SelectTrigger><SelectValue placeholder="Select a schedule..." /></SelectTrigger>
                  <SelectContent>{schedules.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="device-name">Device Name</Label>
                <div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="device-name" placeholder="e.g., 1st Year Bell" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} className="pl-10" /></div>
              </div>
              <div>
                <Label htmlFor="esp-ip">ESP8266 IP Address (in Config Mode)</Label>
                <Input id="esp-ip" placeholder="Usually 192.168.4.1" value={espIp} onChange={(e) => setEspIp(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ssid">WiFi SSID</Label>
                <Input id="ssid" placeholder="Enter your WiFi name" value={ssid} onChange={(e) => setSsid(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter WiFi password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="w-full gradient-button" onClick={handleConnect}>Connect & Save Device</Button>
              <Button variant="outline" className="w-full" onClick={handleRefreshStatus}><RefreshCw className="mr-2 h-4 w-4" /> Refresh Status</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Connection;