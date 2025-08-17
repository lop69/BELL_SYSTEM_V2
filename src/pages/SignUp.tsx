import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { BellRing, Mail, Lock, Eye, EyeOff, User } from "lucide-react";

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignUpFormInputs = z.infer<typeof signUpSchema>;

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

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<SignUpFormInputs>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormInputs) => {
    setIsSubmitting(true);
    const toastId = showLoading("Creating your account...");

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

    dismissToast(toastId);
    setIsSubmitting(false);

    if (error) {
      showError(error.message);
    } else {
      showSuccess("Account created! Please check your email to verify.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen main-gradient p-4 flex flex-col items-center justify-center overflow-y-auto">
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
            >
              <BellRing className="h-10 w-10 text-primary" />
            </motion.div>
            <h1 className="text-3xl font-bold text-primary">Create Account</h1>
            <p className="text-muted-foreground mt-1">Join the community.</p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-4">
              <motion.div
                className="flex-1"
                variants={shakeVariants}
                animate={errors.firstName ? "shake" : "initial"}
              >
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" {...register("firstName")} className="bg-white/50 dark:bg-black/20" />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
              </motion.div>
              <motion.div
                className="flex-1"
                variants={shakeVariants}
                animate={errors.lastName ? "shake" : "initial"}
              >
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" {...register("lastName")} className="bg-white/50 dark:bg-black/20" />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
              </motion.div>
            </div>

            <motion.div variants={shakeVariants} animate={errors.email ? "shake" : "initial"}>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="your@email.com" className="pl-10 bg-white/50 dark:bg-black/20" {...register("email")} />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </motion.div>

            <motion.div variants={shakeVariants} animate={errors.password ? "shake" : "initial"}>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 bg-white/50 dark:bg-black/20" {...register("password")} />
                <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1" onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </motion.div>

            <Button type="submit" className="w-full gradient-button" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>

          <motion.div variants={itemVariants} className="mt-6 text-center">
            <Button
              variant="link"
              className="text-primary hover:text-sky-600"
              onClick={() => navigate('/login')}
            >
              Already have an account? Login
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;