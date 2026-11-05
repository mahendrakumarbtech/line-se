import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();
  if (loading) return <p>Loading...</p>;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}