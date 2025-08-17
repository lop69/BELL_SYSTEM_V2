import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wifi, CheckCircle, XCircle, Loader, AlertTriangle, WifiOff, KeyRound, Tag, Info, BellRing, Signal } from "lucide-react";
import { motion } from "framer-motion";
import { showLoading, dismissToast, showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Schedule } from "@/types/database";

type Status = "connected" | "failed" | "pending" | "disconnected";

const Connection = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("disconnected");
  const [ssid, setSsid] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [deviceName, setDeviceName] = useState<string>("");
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [anonKey] = useState<string>(import.meta.env.VITE_SUPABASE_ANON_KEY || "");
  const configModeIp = "192.168.4.1";

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
    const url = `http://${configModeIp}/${endpoint}`;
    try {
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      showError(`Failed to communicate with device at ${configModeIp}. Ensure you are connected to its 'SmartBell-Config' WiFi and have disabled mobile data.`);
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

    if (response && response.status === 'ok') {
      const { error } = await supabase.from("devices").insert({
        user_id: user.id,
        schedule_id: selectedSchedule,
        device_name: deviceName,
        is_connected: true,
        last_seen: new Date().toISOString(),
      });

      dismissToast(toastId);
      if (error) {
        showError("Device configured, but failed to save to database.");
        setStatus("failed");
      } else {
        showSuccess("Device configured and saved! It will now connect to your WiFi.");
        setStatus("connected");
      }
    } else {
      dismissToast(toastId);
      setStatus("failed");
    }
  };

  const handleTestBell = async () => {
    if (!user) return;
    const toastId = showLoading("Sending test signal...");
    try {
      const { error: activateError } = await supabase
        .from("test_bells")
        .upsert({ user_id: user.id, is_active: true }, { onConflict: 'user_id' });
      if (activateError) throw activateError;

      showSuccess("Test signal sent! The bell should ring within 30 seconds.");

      setTimeout(async () => {
        await supabase
          .from("test_bells")
          .update({ is_active: false })
          .eq("user_id", user.id);
      }, 30000);

    } catch (error) {
      showError("Failed to send test signal.");
    } finally {
      dismissToast(toastId);
    }
  };

  const StatusIndicator = () => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'failed': return <XCircle className="h-12 w-12 text-red-500" />;
      case 'pending': return <Loader className="h-12 w-12 text-muted-foreground animate-spin" />;
      default: return <WifiOff className="h-12 w-12 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Device Connection</h1>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" />Step 1: Connect to Device WiFi</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>To configure your device, first connect your phone to its temporary WiFi network.</p>
            <p><strong>Network Name:</strong> <code className="font-mono bg-muted p-1 rounded-md">SmartBell-Config</code></p>
            <p><strong>Password:</strong> <code className="font-mono bg-muted p-1 rounded-md">password</code></p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-orange-500/50 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500"><AlertTriangle className="h-5 w-5" />Important: Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>If you see a "Failed to send" error, it's likely because your phone disconnected from the device's WiFi.</p>
            <p><strong>Solution:</strong> Before proceeding to Step 2, **temporarily disable Mobile/Cellular Data** on your phone. This forces it to stay connected to `SmartBell-Config`.</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Signal className="h-5 w-5" />Step 2: Send Configuration</CardTitle>
            <CardDescription>Enter your main WiFi details here. This information will be sent to the device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label htmlFor="schedule-select">Assign to Year/Schedule</Label><Select value={selectedSchedule} onValueChange={setSelectedSchedule}><SelectTrigger><SelectValue placeholder="Select a schedule..." /></SelectTrigger><SelectContent>{schedules.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="device-name">Device Name</Label><div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="device-name" placeholder="e.g., 1st Year Bell" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} className="pl-10" /></div></div>
            <div><Label htmlFor="ssid">Your WiFi SSID (Name)</Label><div className="relative"><Wifi className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="ssid" placeholder="Enter your WiFi name" value={ssid} onChange={(e) => setSsid(e.target.value)} className="pl-10" /></div></div>
            <div><Label htmlFor="password">Your WiFi Password</Label><div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="password" type="password" placeholder="Enter WiFi password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" /></div></div>
            <Button className="w-full gradient-button" onClick={handleConnect}>Connect & Save Device</Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="glass-card text-center p-6">
          <CardHeader className="p-0 mb-4"><CardTitle className="flex items-center justify-center gap-2">Step 3: Status & Testing</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4 p-0">
            <StatusIndicator />
            <p className="font-semibold capitalize">{status}</p>
            <CardDescription>Once connected, the device's blue light will blink steadily.</CardDescription>
            <Button variant="outline" className="w-full" onClick={handleTestBell} disabled={status !== 'connected'}><BellRing className="mr-2 h-4 w-4" /> Test Bell</Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Connection;