import { useAuth } from "@/contexts/AuthProvider";
import { Navigate, Outlet } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const ProtectedRoute = () => {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="fixed bottom-0 left-0 right-0 border-t h-16" />
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;