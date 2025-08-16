import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Computer, HardHat, Network, Cog, Zap, CircuitBoard, Pill } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

const departments = [
  { name: 'Computer', icon: Computer },
  { name: 'Civil', icon: HardHat },
  { name: 'IT', icon: Network },
  { name: 'Mechanical', icon: Cog },
  { name: 'Electrical', icon: Zap },
  { name: 'Electronics', icon: CircuitBoard },
  { name: 'Pharmacy', icon: Pill },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 10,
    },
  },
};

const DepartmentSelection = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (departmentName: string) => {
    setSelected(departmentName);
    // Add a small delay to show selection before navigating
    setTimeout(() => {
      navigate('/login');
    }, 300);
  };

  return (
    <div className="min-h-screen main-gradient p-4 flex flex-col items-center justify-center">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-primary">Select Your Department</h1>
        <p className="text-muted-foreground mt-2">Choose where you'll be operating.</p>
      </motion.div>

      <motion.div
        className="w-full max-w-md grid grid-cols-2 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {departments.map((dept) => (
          <motion.div
            key={dept.name}
            className={cn(
              "glass-card p-6 flex flex-col items-center justify-center aspect-square cursor-pointer transition-all duration-300",
              selected === dept.name ? 'ring-2 ring-sky-400 shadow-sky-500/50 scale-105' : 'ring-0'
            )}
            onClick={() => handleSelect(dept.name)}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            variants={itemVariants}
          >
            <dept.icon className="h-12 w-12 text-primary mb-4" />
            <p className="font-semibold text-lg text-center text-primary">{dept.name}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default DepartmentSelection;