import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
            <p className="text-muted-foreground mt-1">Sign in to continue</p>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="light"
          />
          <Separator className="my-6 bg-white/20" />
          <Button
            variant="outline"
            className="w-full bg-white/20 border-white/30 hover:bg-white/30 text-primary"
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