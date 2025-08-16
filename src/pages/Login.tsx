import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BellRing } from "lucide-react";

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

const Login = () => {
  const navigate = useNavigate();
  const { session, loginAsGuest } = useAuth();

  useEffect(() => {
    if (session) {
      navigate("/app");
    }
  }, [session, navigate]);

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
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <BellRing className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
            <p className="text-muted-foreground mt-1">Sign in to continue</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                extend: false,
                className: {
                  button: 'gradient-button !rounded-lg !py-2.5',
                  input: 'bg-white/50 dark:bg-black/20 border-gray-300/50 dark:border-gray-700/50 rounded-lg',
                  label: 'text-muted-foreground',
                  anchor: 'text-primary hover:text-sky-600',
                  message: 'text-red-500 text-sm',
                  divider: 'bg-gray-300/50'
                }
              }}
              providers={['google']}
              theme="light"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="relative my-6">
            <Separator className="bg-gray-300/50" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/70 dark:bg-gray-950/50 px-2 text-xs text-muted-foreground backdrop-blur-sm">OR</span>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              variant="outline"
              className="w-full bg-white/50 border-gray-300/50 hover:bg-white/80 text-primary rounded-lg transition-transform transform hover:scale-105"
              onClick={loginAsGuest}
            >
              Continue as Guest (Demo)
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;