import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { BellRing, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignUpFormInputs = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormInputs>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormInputs) => {
    setIsSubmitting(true);
    const toastId = showLoading("Signing up...");

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (error) {
        showError(error.message);
      } else {
        showSuccess("Sign up successful! You can now log in.");
        navigate("/login");
      }
    } catch (error) {
      showError("An unexpected error occurred during sign up.");
    } finally {
      dismissToast(toastId);
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      showError(`Google sign-up failed: ${error.message}`);
    }
  };

  // Redirect if already logged in
  if (session) {
    navigate("/app");
  }

  return (
    <div className="min-h-screen main-gradient p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-5 bg-primary/10 rounded-full mb-4">
              <BellRing className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Join Us</h1>
            <p className="text-muted-foreground mt-1">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  className="pl-10"
                  {...register("firstName")}
                />
              </div>
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  className="pl-10"
                  {...register("lastName")}
                />
              </div>
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
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
                  className="pl-10 pr-10"
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing up..." : "Sign Up"}
            </Button>
          </form>

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

          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
             <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44.5 24.3H24.5V34.5H36.5C34.5 40.5 29.5 44.5 24.5 44.5C16.5 44.5 10.5 38.5 10.5 30.5C10.5 22.5 16.5 16.5 24.5 16.5C28.5 16.5 31.5 18.5 33.5 20.5L40.5 13.5C36.5 9.5 31.5 6.5 24.5 6.5C13.5 6.5 4.5 15.5 4.5 26.5C4.5 37.5 13.5 46.5 24.5 46.5C35.5 46.5 44.5 38.5 44.5 26.5C44.5 25.5 44.5 24.9 44.5 24.3Z" fill="#FFC107"/><path d="M6.5 14.5L13.5 20.5C15.5 16.5 19.5 13.5 24.5 13.5C28.5 13.5 32.5 15.5 35.5 18.5L42.5 11.5C37.5 7.5 31.5 4.5 24.5 4.5C16.5 4.5 9.5 8.5 6.5 14.5Z" fill="#FF3D00"/><path d="M24.5 48.5C31.5 48.5 37.5 45.5 42.5 41.5L35.5 34.5C32.5 37.5 28.5 39.5 24.5 39.5C19.5 39.5 15.5 36.5 13.5 32.5L6.5 39.5C9.5 44.5 16.5 48.5 24.5 48.5Z" fill="#4CAF50"/><path d="M44.5 24.3H24.5V34.5H36.5C34.5 40.5 29.5 44.5 24.5 44.5C16.5 44.5 10.5 38.5 10.5 30.5C10.5 22.5 16.5 16.5 24.5 16.5C28.5 16.5 31.5 18.5 33.5 20.5L40.5 13.5C36.5 9.5 31.5 6.5 24.5 6.5C13.5 6.5 4.5 15.5 4.5 26.5C4.5 37.5 13.5 46.5 24.5 46.5C35.5 46.5 44.5 38.5 44.5 26.5C44.5 25.5 44.5 24.9 44.5 24.3Z" fill="#1976D2"/></svg>
            Continue with Google
          </Button>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              className="w-full text-primary"
              onClick={() => navigate("/login")}
            >
              Already have an account? Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;