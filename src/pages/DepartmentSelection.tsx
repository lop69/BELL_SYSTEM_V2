import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Computer, HardHat, Network, Cog, Zap, CircuitBoard, Pill } from 'lucide-react';
import { motion } from 'framer-motion';
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

const DepartmentSelection = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen main-gradient p-4 flex flex-col items-center justify-center">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-primary">Select Your Department</h1>
        <p className="text-muted-foreground mt-2">Choose where you'll be operating.</p>
      </motion.div>

      <div className="w-full max-w-md grid grid-cols-2 gap-6">
        {departments.map((dept) => (
          <motion.div
            key={dept.name}
            className={cn(
              "glass-card p-6 flex flex-col items-center justify-center aspect-square cursor-pointer transition-all duration-300",
              selected === dept.name ? 'ring-2 ring-cyan-400' : 'ring-0'
            )}
            onClick={() => setSelected(dept.name)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <dept.icon className="h-12 w-12 text-primary mb-4" />
            <p className="font-semibold text-lg text-center text-primary">{dept.name}</p>
          </motion.div>
        ))}
      </div>

      <motion.button
        className="gradient-button mt-12 w-full max-w-xs"
        onClick={handleContinue}
        disabled={!selected}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Continue
      </motion.button>
    </div>
  );
};

export default DepartmentSelection;