import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { motion } from 'framer-motion';

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/select-department');
    }, 4000); // 4 seconds for the new animation

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen main-gradient overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0, 0.71, 0.2, 1.01] }}
        className="relative flex items-center justify-center"
      >
        {/* Radiating circles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-sky-300/50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 0], scale: 1.5 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'loop',
              delay: i * 0.4 + 0.5,
              ease: 'easeInOut',
            }}
            style={{
              width: `${8 + i * 4}rem`,
              height: `${8 + i * 4}rem`,
            }}
          />
        ))}
        
        {/* Bell Icon with ringing animation */}
        <motion.div
          className="relative bg-white/80 dark:bg-black/80 p-6 rounded-full shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, type: 'spring', stiffness: 120 }}
        >
          <motion.div
            animate={{ rotate: [0, -15, 10, -10, 5, 0] }}
            transition={{ duration: 1.5, delay: 1.5, ease: 'easeInOut' }}
          >
            <BellRing className="h-24 w-24 text-primary" />
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="mt-8 text-center overflow-hidden">
        <motion.h1
          className="text-4xl font-bold text-primary"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, delay: 1.8, ease: 'circOut' }}
        >
          Smart Bell Scheduler
        </motion.h1>
      </div>
      <div className="mt-2 text-center overflow-hidden">
        <motion.p
          className="text-muted-foreground"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, delay: 2.0, ease: 'circOut' }}
        >
          Simplifying Campus Time.
        </motion.p>
      </div>
    </div>
  );
};

export default SplashScreen;