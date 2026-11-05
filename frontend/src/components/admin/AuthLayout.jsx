import { Outlet } from "react-router-dom";
import "../../styles/admin/auth.css";

export default function AuthLayout() {
  return (
    <div className="auth-wrapper d-flex align-items-center justify-content-center min-vh-100 p-3">
      <div className="auth-card card border-0 w-100">
        <div className="card-body p-4 p-sm-5">
          <Outlet />
        </div>
      </div>
    </div>
  );
}