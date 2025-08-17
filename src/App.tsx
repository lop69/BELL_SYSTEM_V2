import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Schedules from "./pages/Schedules";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import { AuthProvider } from "./contexts/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./pages/SplashScreen";
import DepartmentSelection from "./pages/DepartmentSelection";
import { ThemeProvider } from "./contexts/ThemeProvider";
import Connection from "./pages/Connection";
import HelpAndSupport from "./pages/HelpAndSupport";
import { NotificationProvider } from "./contexts/NotificationProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider attribute="class" defaultTheme="light">
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <div className="w-full h-screen main-gradient">
                <Routes>
                  <Route path="/" element={<SplashScreen />} />
                  <Route
                    path="/select-department"
                    element={<DepartmentSelection />}
                  />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/app" element={<Layout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="schedules" element={<Schedules />} />
                      <Route path="connection" element={<Connection />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="support" element={<HelpAndSupport />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;