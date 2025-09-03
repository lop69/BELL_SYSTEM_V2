import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Briefcase, GraduationCap } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BackgroundBeams } from '@/components/ui/background-beams';

const roles = [
  { name: 'Admin', icon: Shield },
  { name: 'HOD', icon: Briefcase },
  { name: 'Student', icon: GraduationCap },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 120, damping: 10 },
  },
  hover: {
    scale: 1.05,
    y: -5,
    transition: { type: 'spring', stiffness: 300, damping: 15 }
  }
};

const iconVariants: Variants = {
  hover: {
    y: [0, -4, 0, 4, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

const RoleSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const department = location.state?.department;
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!department) {
      navigate('/select-department');
    }
  }, [department, navigate]);

  const handleSelect = (roleName: string) => {
    setSelected(roleName);
    localStorage.setItem('signUpRole', roleName);
    localStorage.setItem('signUpDepartment', department);
    setTimeout(() => {
      navigate('/login', { state: { role: roleName, department: department } });
    }, 300);
  };

  return (
    <div className="min-h-screen main-gradient p-4 flex flex-col items-center justify-center relative">
      <BackgroundBeams className="z-0" />
      <div className="relative z-10 w-full">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-primary">Select Your Role</h1>
          <p className="text-muted-foreground mt-2">You are in the <span className="font-semibold text-primary">{department}</span> department.</p>
        </motion.div>

        <motion.div
          className="w-full max-w-md flex flex-col gap-6 mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {roles.map((role) => (
            <motion.div
              key={role.name}
              className={cn(
                "glass-card p-6 flex items-center justify-start gap-6 cursor-pointer transition-all duration-300 hover:shadow-primary/30 hover:shadow-xl hover:border-primary/50",
                selected === role.name ? 'ring-2 ring-sky-400 shadow-sky-500/50 scale-105' : 'ring-0'
              )}
              onClick={() => handleSelect(role.name)}
              variants={itemVariants}
              whileHover="hover"
              whileTap={{ scale: 0.95 }}
            >
              <motion.div variants={iconVariants}>
                <role.icon className="h-10 w-10 text-primary" />
              </motion.div>
              <p className="font-semibold text-xl text-primary">{role.name}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default RoleSelection;