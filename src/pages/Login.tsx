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
import { fetchProfile } from "@/contexts/AuthProvider";

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
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44.5 24.3H24.5V34.5H36.5C34.5 40.5 29.5 44.5 24.5 44.5C16.5 44.5 10.5 38.5 10.5 30.5C10.5 22.5 16.5 16.5 24.5 16.5C28.5 16.5 31.5 18.5 33.5 20.5L40.5 13.5C36.5 9.5 31.5 6.5 24.5 6.5C13.5 6.5 4.5 15.5 4.5 26.5C4.5 37.5 13.5 46.5 24.5 46.5C35.5 46.5 44.5 38.5 44.5 26.5C44.5 25.5 44.5 24.9 44.5 24.3Z" fill="#FFC107"/><path d="M6.5 14.5L13.5 20.5C15.5 16.5 19.5 13.5 24.5 13.5C28.5 13.5 32.5 15.5 35.5 18.5L42.5 11.5C37.5 7.5 31.5 4.5 24.5 4.5C16.5 4.5 9.5 8.5 6.5 14.5Z" fill="#FF3D00"/><path d="M24.5 48.5C31.5 48.5 37.5 45.5 42.5 41.5L35.5 34.5C32.5 37.5 28.5 39.5 24.5 39.5C19.5 39.5 15.5 36.5 13.5 32.5L6.5 39.5C9.5 44.5 16.5 48.5 24.5 48.5Z" fill="#4CAF50"/><path d="M44.5 24.3H24.5V34.5H36.5C34.5 40.5 29.5 44.5 24.5 44.5C16.5 44.5 10.5 38.5 10.5 30.5C10.5 22.5 16.5 16.5 24.5 16.5C28.5 16.5 31.5 18.5 33.5 20.5L40.5 13.5C36.5 9.5 31.5 6.5 24.5 6.5C13.5 6.5 4.5 15.5 4.5 26.5C4.5 37.5 13.5 46.5 24.5 46.5C35.5 46.5 44.5 38.5 44.5 26.5C44.5 25.5 44.5 24.9 44.5 24.3Z" fill="#1976D2"/></svg>
                  Continue with Google
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGitHubSignIn}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  Continue with GitHub
                </Button>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <Button
              variant="link"
              className="w-full text-primary"
              onClick={() => navigate("/signup", { state: { role, department } })}
            >
              Don't have an account? Sign Up
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;