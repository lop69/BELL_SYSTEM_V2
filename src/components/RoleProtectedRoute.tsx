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

  if (profile?.role) {
    const userRole = profile.role.trim().toLowerCase();
    const allowedRolesLower = allowedRoles.map(r => r.toLowerCase());
    if (!allowedRolesLower.includes(userRole)) {
      // Redirect them to the main app dashboard if they don't have access.
      return <Navigate to="/app" replace />;
    }
  } else {
    // This case should be handled by the main ProtectedRoute, but as a fallback:
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;