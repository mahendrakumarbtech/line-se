import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <>
      <h4 className="auth-title mb-1">Forgot Password?</h4>
      <p className="auth-subtitle mb-4">Coming soon. Contact admin.</p>
      <Link to="/admin/login" className="btn btn-primary d-grid w-100">Back to login</Link>
    </>
  );
}