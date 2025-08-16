import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { motion } from 'framer-motion';

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/select-department');
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen main-gradient overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      <motion.div
        className="relative"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2, type: 'spring', stiffness: 100 }}
      >
        <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full blur-xl opacity-75 animate-pulse" />
        <div className="relative bg-white/80 dark:bg-black/80 p-6 rounded-full">
          <BellRing className="h-24 w-24 text-primary" />
        </div>
      </motion.div>
      <motion.h1
        className="text-4xl font-bold mt-8 text-primary"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        Smart Bell Scheduler
      </motion.h1>
      <motion.p
        className="text-muted-foreground mt-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        Simplifying Campus Time.
      </motion.p>
    </motion.div>
  );
};

export default SplashScreen;