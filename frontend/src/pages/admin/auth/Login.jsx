import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../../context/AdminAuthContext";

export default function Login() {
  const { login, isAuthenticated, loading } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
const [showPass, setShowPass] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate("/admin/dashboard", { replace: true });
  };

  return (
    <>
      <div className="app-brand mb-4 text-center">
        <span className="auth-brand">LineSe</span>
      </div>
      <h4 className="auth-title mb-1">Welcome to LineSe! 👋</h4>
      <p className="auth-subtitle mb-4">Sign in to your admin account</p>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <div className="d-flex justify-content-between">
            <label className="form-label">Password</label>
            <Link to="/admin/forgot-password"><small>Forgot?</small></Link>
          </div>
          <div className="input-group">
            <input className="form-control" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPass(v => !v)}>
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button className="btn btn-primary d-grid w-100" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </>
  );
}