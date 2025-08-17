import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const SignUp = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          navigate("/app");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

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
            <h1 className="text-3xl font-bold text-primary">Join Us!</h1>
            <p className="text-muted-foreground mt-1">Create your account</p>
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
              providers={[]}
              theme="light"
            />
          </motion.div>

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