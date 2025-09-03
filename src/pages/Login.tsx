import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { BellRing, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { fetchProfile } from "@/api/profile";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role;
  const department = location.state?.department;
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!role || !department) {
      navigate('/select-department');
    }
    if (session) {
      navigate("/app");
    }
  }, [session, navigate, role, department]);

  const onSubmit = async (data: LoginFormInputs) => {
    setIsSubmitting(true);
    const toastId = showLoading("Logging in...");

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        showError(error.message);
      } else if (authData.user) {
        // Pre-fetch profile data immediately after successful login
        await queryClient.prefetchQuery({
          queryKey: ['profile', authData.user.id],
          queryFn: () => fetchProfile(authData.user.id),
        });
        showSuccess("Logged in successfully!");
        navigate("/app");
      } else {
        throw new Error("Login successful but no user data received.");
      }
    } catch (error: any) {
      showError(error.message || "An unexpected error occurred");
    } finally {
      dismissToast(toastId);
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });
    if (error) {
      showError(`Google sign-in failed: ${error.message}`);
    }
  };

  const handleGitHubSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });
    if (error) {
      showError(`GitHub sign-in failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen main-gradient p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-5 bg-primary/10 rounded-full mb-4">
              <BellRing className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
            <p className="text-muted-foreground mt-1">Login as {role} in {department}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10 glass-input"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 glass-input"
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full gradient-button" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>

          {role === 'Student' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44.5 24<dyad-problem-report summary="29 problems">
<problem file="src/contexts/AuthProvider.tsx" line="6" column="65" code="2307">Cannot find module '@/api/profile' or its corresponding type declarations.</problem>
<problem file="src/components/BellManagementDialog.tsx" line="15" column="26" code="2307">Cannot find module '@/hooks/useBells' or its corresponding type declarations.</problem>
<problem file="src/components/ScheduleGroupItem.tsx" line="14" column="30" code="2307">Cannot find module '@/hooks/useSchedules' or its corresponding type declarations.</problem>
<problem file="src/pages/Schedules.tsx" line="15" column="30" code="2307">Cannot find module '@/hooks/useSchedules' or its corresponding type declarations.</problem>
<problem file="src/pages/Devices.tsx" line="7" column="28" code="2307">Cannot find module '@/hooks/useDevices' or its corresponding type declarations.</problem>
<problem file="src/pages/Dashboard.tsx" line="4" column="34" code="2307">Cannot find module '@/hooks/useDashboardData' or its corresponding type declarations.</problem>
<problem file="src/pages/Dashboard.tsx" line="5" column="29" code="2307">Cannot find module './dashboard/DashboardHeader' or its corresponding type declarations.</problem>
<problem file="src/pages/Dashboard.tsx" line="6" column="30" code="2307">Cannot find module './dashboard/DashboardMetrics' or its corresponding type declarations.</problem>
<problem file="src/pages/Dashboard.tsx" line="7" column="30" code="2307">Cannot find module './dashboard/DashboardActions' or its corresponding type declarations.</problem>
<problem file="src/pages/Dashboard.tsx" line="8" column="28" code="2307">Cannot find module './dashboard/TodaysSchedule' or its corresponding type declarations.</problem>
<problem file="src/components/Layout.tsx" line="7" column="19" code="2459">Module '&quot;@/contexts/AuthProvider&quot;' declares 'fetchProfile' locally, but it is not exported.</problem>
<problem file="src/components/Layout.tsx" line="9" column="10" code="2614">Module '&quot;@/pages/Schedules&quot;' has no exported member 'fetchScheduleGroups'. Did you mean to use 'import fetchScheduleGroups from &quot;@/pages/Schedules&quot;' instead?</problem>
<problem file="src/components/Layout.tsx" line="10" column="10" code="2614">Module '&quot;@/components/BellManagementDialog&quot;' has no exported member 'fetchBellsForSchedule'. Did you mean to use 'import fetchBellsForSchedule from &quot;@/components/BellManagementDialog&quot;' instead?</problem>
<problem file="src/components/Layout.tsx" line="11" column="10" code="2614">Module '&quot;@/pages/Devices&quot;' has no exported member 'fetchDevices'. Did you mean to use 'import fetchDevices from &quot;@/pages/Devices&quot;' instead?</problem>
<problem file="src/components/Layout.tsx" line="12" column="10" code="2614">Module '&quot;@/pages/Dashboard&quot;' has no exported member 'fetchDashboardData'. Did you mean to use 'import fetchDashboardData from &quot;@/pages/Dashboard&quot;' instead?</problem>
<problem file="src/pages/Settings.tsx" line="4" column="29" code="2307">Cannot find module './settings/ProfileSettings' or its corresponding type declarations.</problem>
<problem file="src/pages/Settings.tsx" line="5" column="32" code="2307">Cannot find module './settings/AppearanceSettings' or its corresponding type declarations.</problem>
<problem file="src/pages/Settings.tsx" line="6" column="34" code="2307">Cannot find module './settings/NotificationSettings' or its corresponding type declarations.</problem>
<problem file="src/pages/Settings.tsx" line="7" column="24" code="2307">Cannot find module './settings/DangerZone' or its corresponding type declarations.</problem>
<problem file="src/pages/Settings.tsx" line="8" column="36" code="2307">Cannot find module './settings/HelpAndSupportSettings' or its corresponding type declarations.</problem>
<problem file="src/pages/Login.tsx" line="14" column="10" code="2459">Module '&quot;@/contexts/AuthProvider&quot;' declares 'fetchProfile' locally, but it is not exported.</problem>
<problem file="src/hooks/useDashboardData.ts" line="3" column="36" code="2307">Cannot find module '@/api/dashboard' or its corresponding type declarations.</problem>
<problem file="src/hooks/useDevices.ts" line="4" column="30" code="2307">Cannot find module '@/api/devices' or its corresponding type declarations.</problem>
<problem file="src/hooks/useSchedules.ts" line="5" column="108" code="2307">Cannot find module '@/api/schedules' or its corresponding type declarations.</problem>
<problem file="src/hooks/useBells.ts" line="5" column="63" code="2307">Cannot find module '@/api/bells' or its corresponding type declarations.</problem>
<problem file="src/pages/dashboard/DashboardMetrics.tsx" line="23" column="19" code="2322">Type '{ hidden: { y: number; opacity: number; }; visible: { y: number; opacity: number; transition: { duration: number; ease: number[]; }; }; }' is not assignable to type 'Variants'.
  Property 'visible' is incompatible with index signature.
    Type '{ y: number; opacity: number; transition: { duration: number; ease: number[]; }; }' is not assignable to type 'Variant'.
      Type '{ y: number; opacity: number; transition: { duration: number; ease: number[]; }; }' is not assignable to type 'TargetAndTransition'.
        Type '{ y: number; opacity: number; transition: { duration: number; ease: number[]; }; }' is not assignable to type '{ transition?: Transition&lt;any&gt;; transitionEnd?: ResolvedValues; }'.
          Types of property 'transition' are incompatible.
            Type '{ duration: number; ease: number[]; }' is not assignable to type 'Transition&lt;any&gt;'.
              Type '{ duration: number; ease: number[]; }' is not assignable to type 'TransitionWithValueOverrides&lt;any&gt;'.
                Type '{ duration: number; ease: number[]; }' is not assignable to type 'ValueAnimationTransition&lt;any&gt;'.
                  Types of property 'ease' are incompatible.
                    Type 'number[]' is not assignable to type 'Easing | Easing[]'.
                      Type 'number[]' is not assignable to type 'EasingFunction | Easing[]'.
                        Type 'number[]' is not assignable to type 'Easing[]'.
                          Type 'number' is not assignable to type 'Easing'.</problem>
<problem file="src/pages/dashboard/DashboardMetrics.tsx" line="33" column="19" code="2322">Type '{ hidden: { y: number; opacity: number; }; visible: { y: number; opacity: number; transition: { duration: number; ease: number[]; }; }; }' is not assignable to type 'Variants'.
  Property 'visible' is incompatible with index signature.
    Type '{ y: number; opacity: number; transition: { duration: number; ease: number[]; }; }' is not assignable to type 'Variant'.
      Type '{ y: number; opacity: number; transition: { duration: number; ease: number[]; }; }' is not assignable to type 'TargetAndTransition'.
        Type '{ y: number; opacity: number; transition: { duration: number; ease: number[]; }; }' is not assignable to type '{ transition?: Transition&lt;any&gt;; transitionEnd?: ResolvedValues; }'.
          Types of property 'transition' are incompatible.
            Type '{ duration: number; ease: number[]; }' is not assignable to type 'Transition&lt;any&gt;'.
              Type '{ duration: number; ease: number[]; }' is not assignable to type 'TransitionWithValueOverrides&lt;any&gt;'.
                Type '{ duration: number; ease: number[]; }' is not assignable to type 'ValueAnimationTransition&lt;any&gt;'.
                  Types of property 'ease' are incompatible.
                    Type 'number[]' is not assignable to type 'Easing | Easing[]'.
                      Type 'number[]' is not assignable to type 'EasingFunction | Easing[]'.
                        Type 'number[]' is not assignable to type 'Easing[]'.
                          Type 'number' is not assignable to type 'Easing'.</problem>
<problem file="src/pages/dashboard/DashboardActions.tsx" line="38" column="17" code="2322">Type '{ hidden: { y: number; opacity: number; }; visible: { y: number; opacity: number; transition: { duration: number; ease: number[]; }; }; }' is not assignable to type 'Variants'.
  Property 'visible' is incompatible with index signature.
    Type '{ y: number; opacity: number; transition: { duration: number; ease: number[]; }; }' is not assignable to type 'Variant'.
      Type '{ y: number; opacity: number; transition: { duration: number; ease: number[]; }; }' is not assignable to type 'TargetAndTransition'.
        Type '{ y: number; opacity: number; transition: { duration: number; ease: number[]; }; }' is not assignable to type '{ transition?: Transition&lt;any&gt;; transitionEnd?: ResolvedValues; }'.
          Types of property 'transition' are incompatible.
            Type '{ duration: number; ease: number[]; }' is not assignable to type 'Transition&lt;any&gt;'.
              Type '{ duration: number; ease: number[]; }' is not assignable to type 'TransitionWithValueOverrides&lt;any&gt;'.
                Type '{ duration: number; ease: number[]; }' is not assignable to type 'ValueAnimationTransition&lt;any&gt;'.
                  Types of property 'ease' are incompatible.
                    Type 'number[]' is not assignable to type 'Easing | Easing[]'.
                      Type 'number[]' is not assignable to type 'EasingFunction | Easing[]'.
                        Type 'number[]' is not assignable to type 'Easing[]'.
                          Type 'number' is not assignable to type 'Easing'.</problem>
<problem file="src/pages/dashboard/TodaysSchedule.tsx" line="35" column="17" code="2322">Type '{ hidden: { y: number; opacity: number; }; visible: { y: number; opacity: number; transition: { duration: number; ease: number[]; }; }; }' is not assignable to type 'Variants'.
  Property 'visible' is incompatible with index signature.
    Type '{ y: number; opacity: number; transition: { duration: number; ease: number[]; }; }' is not assignable to type 'Variant'.
      Type '{ y: number; opacity: number; transition: { duration: number; ease: number[]; }; }' is not assignable to type 'TargetAndTransition'.
        Type '{ y: number; opacity: number; transition: { duration: number; ease: number[]; }; }' is not assignable to type '{ transition?: Transition&lt;any&gt;; transitionEnd?: ResolvedValues; }'.
          Types of property 'transition' are incompatible.
            Type '{ duration: number; ease: number[]; }' is not assignable to type 'Transition&lt;any&gt;'.
              Type '{ duration: number; ease: number[]; }' is not assignable to type 'TransitionWithValueOverrides&lt;any&gt;'.
                Type '{ duration: number; ease: number[]; }' is not assignable to type 'ValueAnimationTransition&lt;any&gt;'.
                  Types of property 'ease' are incompatible.
                    Type 'number[]' is not assignable to type 'Easing | Easing[]'.
                      Type 'number[]' is not assignable to type 'EasingFunction | Easing[]'.
                        Type 'number[]' is not assignable to type 'Easing[]'.
                          Type 'number' is not assignable to type 'Easing'.</problem>
</dyad-problem-report>You're right, my apologies. It seems my last big refactor left behind a number of TypeScript errors due to incorrect import paths and type mismatches. My apologies for that. I'll clean up all 29 of them right now.

The core of the problem is that some components are trying to import code from the wrong places, and a few type definitions are missing or incorrect. I'll fix this by:

1.  Correcting all the import paths to point to the new modular `api` and `hooks` files.
2.  Fixing a type issue with the animation variants used on the dashboard.
3.  Simplifying the main `Layout` component to remove unnecessary and incorrect data-fetching logic.

Here are the precise changes to resolve every error.

<dyad-write path="src/lib/animations.ts" description="Creating a shared animation variants file to fix type errors and ensure consistency.">
import { Variants } from "framer-motion";

export const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};