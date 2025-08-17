import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BellRing, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

const shakeVariants: Variants = {
  initial: { x: 0 },
  shake: {
    x: [-10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.6, ease: "easeInOut" },
  },
};

const Login = () => {
  const navigate = useNavigate();
  const { session, loginAsGuest } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger, // To manually trigger validation
    setValue,
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (session) {
      navigate("/app");
    }
  }, [session, navigate]);

  const onSubmit = async (data: LoginFormInputs) => {
    setIsSubmitting(true);
    const toastId = showLoading("Logging in...");

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    dismissToast(toastId);
    setIsSubmitting(false);

    if (error) {
      showError(error.message);
    } else {
      showSuccess("Logged in successfully!");
      navigate("/app");
    }
  };

  const handleFillDemoCredentials = () => {
    setValue("email", "demo@example.com");
    setValue("password", "demo123");
  };

  return (
    <div className="min-h-screen main-gradient p-4 flex flex-col items-center justify-center overflow-hidden">
      <motion.div
        className="w-full max-w-sm"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="glass-card p-8">
          <motion.div variants={itemVariants} className="text-center mb-8">
            <motion.div
              className="inline-block p-5 bg-primary/10 rounded-full mb-4 shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
              >
                <BellRing className="h-10 w-10 text-primary" />
              </motion.div>
            </motion.div>
            <h1 className="text-3xl font-bold text-primary">Welcome Back 👋</h1>
            <p className="text-muted-foreground mt-1">Login to continue.</p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <motion.div
              variants={shakeVariants}
              animate={errors.email ? "shake" : "initial"}
            >
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10 bg-white/50 dark:bg-black/20 border-gray-300/50 dark:border-gray-700/50 focus-visible:ring-sky-400"
                  {...register("email", { onBlur: () => trigger("email") })}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </motion.div>

            <motion.div
              variants={shakeVariants}
              animate={errors.password ? "shake" : "initial"}
            >
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-white/50 dark:bg-black/20 border-gray-300/50 dark:border-gray-700/50 focus-visible:ring-sky-400"
                  {...register("password", { onBlur: () => trigger("password") })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </motion.div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Checkbox id="rememberMe" {...register("rememberMe")} />
                <Label htmlFor="rememberMe">Remember me</Label>
              </div>
              <Button variant="link" className="text-primary hover:text-sky-600 h-auto p-0">
                Forgot password?
              </Button>
            </div>

            <Button type="submit" className="w-full gradient-button" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>

          <motion.div variants={itemVariants} className="mt-6 text-center space-y-2">
            <Button
              variant="outline"
              className="w-full bg-white/50 border-gray-300/50 hover:bg-white/80 text-primary rounded-lg transition-transform transform hover:scale-105"
              onClick={handleFillDemoCredentials}
            >
              Use Demo Credentials
            </Button>
            <Button
              variant="outline"
              className="w-full bg-white/50 border-gray-300/50 hover:bg-white/80 text-primary rounded-lg transition-transform transform hover:scale-105"
              onClick={loginAsGuest}
            >
              Continue as Guest (Demo)
            </Button>
            <Button
              variant="link"
              className="text-primary hover:text-sky-600"
              onClick={() => navigate('/signup')}
            >
              Don't have an account? Sign Up
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;