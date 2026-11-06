import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { notify } from "../../../components/common/toast";
import FormField from "../../../components/common/FormField";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!email.trim()) next.email = t("validation.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = t("validation.emailInvalid");
    }
    if (Object.keys(next).length) {
      setErrors(next);
      notify.error(t("validation.formInvalid"));
      return;
    }

    setSubmitting(true);
    // TODO: apiPost("/admin/auth/forgot-password", { email: email.trim() })
    setSubmitting(false);
    notify.success(t("auth.forgotSent"));
  };

  return (
    <>
      <h4 className="auth-title mb-1">{t("auth.forgotPassword")}</h4>
      <p className="auth-subtitle mb-4">{t("auth.forgotHint")}</p>

      <form onSubmit={onSubmit} noValidate>
        <FormField label={t("auth.email")} htmlFor="forgot-email" error={errors.email}>
          <input
            id="forgot-email"
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
        <button className="btn btn-primary d-grid w-100" disabled={submitting}>
          {submitting ? "..." : t("auth.sendReset")}
        </button>
      </form>

      <div className="text-center mt-3">
        <Link to="/admin/login">
          <small>{t("auth.backToLogin")}</small>
        </Link>
      </div>
    </>
  );
}