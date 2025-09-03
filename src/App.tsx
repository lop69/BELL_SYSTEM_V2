import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { NotificationProvider } from "./contexts/NotificationProvider";
import FullScreenLoader from "./components/FullScreenLoader";

const Layout = lazy(() => import("./components/Layout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Schedules = lazy(() => import("./pages/Schedules"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const RoleProtectedRoute = lazy(() => import("./components/RoleProtectedRoute"));
const SplashScreen = lazy(() => import("./pages/SplashScreen"));
const DepartmentSelection = lazy(() => import("./pages/DepartmentSelection"));
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const Devices = lazy(() => import("./pages/Devices"));
const HelpAndSupport = lazy(() => import("./pages/HelpAndSupport"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <div className="w-full h-screen main-gradient">
                <div className="max-w-md mx-auto h-full shadow-2xl shadow-black/20 relative overflow-hidden">
                  <Suspense fallback={<FullScreenLoader />}>
                    <Routes>
                      <Route path="/" element={<SplashScreen />} />
                      <Route path="/select-department" element={<DepartmentSelection />} />
                      <Route
                        path="/select-role"
                        element={<RoleSelection />}
                      />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route element={<ProtectedRoute />}>
                        <Route path="/app" element={<Layout />}>
                          <Route index element={<Dashboard />} />
                          <Route path="settings" element={<Settings />} />
                          <Route path="support" element={<HelpAndSupport />} />
                          
                          {/* Routes for Admin and HOD only */}
                          <Route element={<RoleProtectedRoute allowedRoles={['Admin', 'HOD']} />}>
                            <Route path="schedules" element={<Schedules />} />
                            <Route path="devices" element={<Devices />} />
                          </Route>
                        </Route>
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </div>
              </div>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;