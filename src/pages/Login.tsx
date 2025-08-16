import { Auth } from "@supabase/auth-ui-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BellRing } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { session, loginAsGuest } = useAuth();

  useEffect(() => {
    if (session) {
      navigate("/app");
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen main-gradient p-4 flex flex-col items-center justify-center">
      <motion.div
        className="w-full max-w-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <BellRing className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
            <p className="text-muted-foreground mt-1">Sign in or create an account to continue</p>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{
              extend: false,
              className: {
                button: 'gradient-button !rounded-lg !py-2.5',
                input: 'bg-white/50 dark:bg-black/20 border-gray-300/50 dark:border-gray-700/50 rounded-lg',
                label: 'text-muted-foreground',
                anchor: 'text-primary hover:text-sky-600',
                message: 'text-red-500 text-sm'
              }
            }}
            providers={[]}
            theme="light"
          />
          <div className="relative my-6">
            <Separator className="bg-gray-300/50" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/70 dark:bg-gray-950/50 px-2 text-xs text-muted-foreground backdrop-blur-sm">OR</span>
          </div>
          <Button
            variant="outline"
            className="w-full bg-white/50 border-gray-300/50 hover:bg-white/80 text-primary rounded-lg"
            onClick={loginAsGuest}
          >
            Continue as Guest (Demo)
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;