import { useAuth } from "@/contexts/AuthProvider";
import { Navigate, Outlet } from "react-router-dom";
import FullScreenLoader from "./FullScreenLoader";

interface RoleProtectedRouteProps {
  allowedRoles: string[];
}

const RoleProtectedRoute = ({ allowedRoles }: RoleProtectedRouteProps) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  // The role check is only performed if a profile exists.
  // The main ProtectedRoute already handles non-authenticated users.
  if (profile && !allowedRoles.includes(profile.role!)) {
    // Redirect them to the main app dashboard if they don't have access.
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;