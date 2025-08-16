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
import { AuthProvider } from "./contexts/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./pages/SplashScreen";
import DepartmentSelection from "./pages/DepartmentSelection";
import { ThemeProvider } from "./contexts/ThemeProvider";
import Connection from "./pages/Connection";

const queryClient = new QueryClient();

const App = () => (
  <div className="w-full h-full bg-gray-200 dark:bg-gray-900 flex items-center justify-center p-4">
    <div className="w-full max-w-sm h-full max-h-[844px] bg-background rounded-3xl border-8 border-black shadow-2xl overflow-hidden relative">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider attribute="class" defaultTheme="light">
            <Toaster />
            <BrowserRouter>
              <AuthProvider>
                <div className="h-full overflow-y-auto">
                  <Routes>
                    <Route path="/" element={<SplashScreen />} />
                    <Route
                      path="/select-department"
                      element={<DepartmentSelection />}
                    />
                    <Route path="/login" element={<Login />} />
                    <Route element={<ProtectedRoute />}>
                      <Route path="/app" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="schedules" element={<Schedules />} />
                        <Route path="connection" element={<Connection />} />
                        <Route path="settings" element={<Settings />} />
                      </Route>
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </AuthProvider>
            </BrowserRouter>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  </div>
);

export default App;