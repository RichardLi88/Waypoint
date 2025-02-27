import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RequireAuth = ({ AllowedRoles }: { AllowedRoles: string[] }) => {
  const { session } = useAuth();
  const location = useLocation();

  return (
    session?.username && session?.role
      ? (AllowedRoles.includes(session.role) ? <Outlet /> : <Navigate to="/" replace />)
      : <Navigate to="/login" state={{ from: location }} replace />
  );
}

export default RequireAuth;
