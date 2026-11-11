import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import PasswordInput from "../../../components/common/PasswordInput";
import FormField from "../../../components/common/FormField";
import { applyServerErrors, notify } from "../../../utils/custom";

export default function Login() {
  const { t } = useTranslation();
  const { login, isAuthenticated, loading } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  if (!loading && isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!email.trim()) next.email = t("validation.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = t("validation.emailInvalid");
    }
    if (!password) next.password = t("validation.passwordRequired");

    if (Object.keys(next).length) {
      setErrors(next);
      notify.error(t("validation.formInvalid"));
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);

    if (result.status !== 1) {
      // Backend: { status:0, message: FORM_INVALID, errors: { email, password } }
      applyServerErrors(result, setErrors);
      notify.error(result.message || t("validation.formInvalid"));
      return;
    }
    notify.success(result.message || t("auth.signInSuccess"));
    navigate("/admin/dashboard", { replace: true });
  };

  return (
    <>
      <div className="app-brand mb-4 text-center">
        <span className="auth-brand">LineSe</span>
      </div>
      <h4 className="auth-title mb-1">{t("auth.welcome")}</h4>
      <p className="auth-subtitle mb-4">{t("auth.subtitle", "Sign in to your admin account")}</p>

      <form onSubmit={onSubmit} noValidate>
        <FormField label={t("auth.email")} htmlFor="email" error={errors.email}>
          <input
            id="email"
            className={`form-control ${errors.email ? "is-invalid" : ""}`}
            type="email"
            value={email}
            placeholder={t("auth.emailPlaceholder")}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((p) => ({ ...p, email: "" }));
            }}
          />
        </FormField>
        <div className="d-flex justify-content-between mb-1">
          <label className="form-label mb-0" htmlFor="password">{t("auth.password")}</label>
          <Link to="/admin/forgot-password"><small>{t("auth.forgotPassword")}</small></Link>
        </div>
        <FormField htmlFor="password" error={errors.password}>
          <PasswordInput
            id="password"
            value={password}
            invalid={!!errors.password}
            placeholder={t("auth.passwordPlaceholder")}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((p) => ({ ...p, password: "" }));
            }}
          />
        </FormField>
        <button className="btn btn-primary d-grid w-100" disabled={submitting}>
          {submitting ? "..." : t("auth.signIn")}
        </button>
      </form>
    </>
  );
}
