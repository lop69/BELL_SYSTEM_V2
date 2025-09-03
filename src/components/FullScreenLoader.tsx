import { Loader } from 'lucide-react';

const FullScreenLoader = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Loader className="h-8 w-8 text-primary animate-spin" />
    </div>
  );
};

export default FullScreenLoader;