import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing } from 'lucide-react';

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/select-department');
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background animate-pulse">
      <BellRing className="h-24 w-24 text-primary" />
      <h1 className="text-4xl font-bold mt-4 text-primary">Bell Control</h1>
      <p className="text-muted-foreground mt-2">Loading your experience...</p>
    </div>
  );
};

export default SplashScreen;