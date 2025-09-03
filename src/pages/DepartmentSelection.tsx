import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Cog, Zap, CircuitBoard, Network, Pill, Laptop } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BackgroundBeams } from '@/components/ui/background-beams';

const departments = [
  { name: 'Computer', icon: Laptop },
  { name: 'IT', icon: Network },
  { name: 'Electronics', icon: CircuitBoard },
  { name: 'Electrical', icon: Zap },
  { name: 'Mechanical', icon: Cog },
  { name: 'Civil', icon: Building2 },
  { name: 'Pharmacy', icon: Pill },
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

const DepartmentSelection = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (departmentName: string) => {
    setSelected(departmentName);
    setTimeout(() => {
      navigate('/select-role', { state: { department: departmentName } });
    }, 300);
  };

  return (
    <div className="h-screen main-gradient p-4 flex flex-col overflow-y-auto relative">
      <BackgroundBeams className="z-0" />
      <div className="relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center my-12 flex-shrink-0"
        >
          <h1 className="text-4xl font-bold text-primary">Select Your Department</h1>
          <p className="text-muted-foreground mt-2">Choose your department to continue.</p>
        </motion.div>

        <motion.div
          className="w-full max-w-md flex flex-col gap-6 mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {departments.map((dept) => (
            <motion.div
              key={dept.name}
              className={cn(
                "glass-card p-6 flex items-center justify-start gap-6 cursor-pointer transition-all duration-300 hover:shadow-primary/30 hover:shadow-xl hover:border-primary/50",
                selected === dept.name ? 'ring-2 ring-sky-400 shadow-sky-500/50 scale-105' : 'ring-0'
              )}
              onClick={() => handleSelect(dept.name)}
              variants={itemVariants}
              whileHover="hover"
              whileTap={{ scale: 0.95 }}
            >
              <motion.div variants={iconVariants}>
                <dept.icon className="h-10 w-10 text-primary" />
              </motion.div>
              <p className="font-semibold text-xl text-primary">{dept.name}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default DepartmentSelection;