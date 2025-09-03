import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { BackgroundBeams } from '@/components/ui/background-beams';

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/select-department');
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const title = "Smart Bell Scheduler";
  const titleVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 1.5,
      },
    },
  };

  const letterVariants: Variants = {
    hidden: { y: "100%", opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: 'circOut',
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen main-gradient overflow-hidden relative">
      <BackgroundBeams className="z-0" />
      <div className="relative z-10 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0, 0.71, 0.2, 1.01] }}
          className="relative flex items-center justify-center"
        >
          <motion.div
            className="absolute rounded-full border border-sky-300/50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 0], scale: 2.5 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatType: 'loop',
              delay: 0.5,
              ease: 'easeInOut',
            }}
            style={{ width: `8rem`, height: `8rem` }}
          />
          <motion.div
            className="relative glass-card p-6 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, type: 'spring', stiffness: 120 }}
            style={{ animation: 'breathing 4s ease-in-out infinite' }}
          >
            <motion.div
              animate={{ rotate: [0, -15, 10, -10, 5, 0] }}
              transition={{ duration: 1.5, delay: 1.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
            >
              <BellRing className="h-24 w-24 text-primary" />
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="mt-8 text-center overflow-hidden">
          <motion.h1
            className="text-4xl font-bold text-primary"
            variants={titleVariants}
            initial="hidden"
            animate="visible"
          >
            {title.split("").map((char, index) => (
              <motion.span key={index} variants={letterVariants} style={{ display: 'inline-block', whiteSpace: 'pre' }}>
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.h1>
        </div>
        <div className="mt-2 text-center overflow-hidden">
          <motion.p
            className="text-muted-foreground"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 1.7, ease: 'circOut' }}
          >
            Simplifying Campus Time.
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;