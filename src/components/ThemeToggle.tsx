import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion, Transition } from "framer-motion";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  const spring: Transition = {
    type: "spring",
    stiffness: 700,
    damping: 30,
  };

  return (
    <div className="flex items-center space-x-2">
      <Sun className={`h-5 w-5 transition-colors ${!isDarkMode ? 'text-primary' : 'text-muted-foreground'}`} />
      <div
        className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${isDarkMode ? 'justify-end bg-primary/50' : 'justify-start bg-zinc-300/50'}`}
        onClick={toggleTheme}
      >
        <motion.div
          className="w-6 h-6 bg-white/80 backdrop-blur-md rounded-full shadow-lg"
          layout
          transition={spring}
        />
      </div>
      <Moon className={`h-5 w-5 transition-colors ${isDarkMode ? 'text-primary' : 'text-muted-foreground'}`} />
    </div>
  );
};