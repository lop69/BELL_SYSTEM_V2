import { useAuth } from "@/contexts/AuthProvider";
import { Navigate, Outlet } from "react-router-dom";
import FullScreenLoader from "./FullScreenLoader";
import { Button } from "@/components/ui/button";

const ProtectedRoute = () => {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // After loading, if there's a user but no profile/role, it's an invalid state.
  if (user && (!profile || !profile.role)) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center text-center p-4 main-gradient">
        <div className="glass-card p-8 space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Profile Error</h1>
          <p className="text-muted-foreground">
            Your user profile could not be loaded. This is required to use the app.
          </p>
          <Button onClick={signOut} variant="destructive" className="w-full">
            Logout and Try Again
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;