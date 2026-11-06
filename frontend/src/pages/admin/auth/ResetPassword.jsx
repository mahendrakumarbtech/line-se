import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PasswordInput from "../../../components/common/PasswordInput";
import FormField from "../../../components/common/FormField";
import { notify } from "../../../components/common/toast";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token")?.trim() || "", [params]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!token) next.token = t("validation.resetTokenMissing");
    if (!password) next.password = t("validation.passwordRequired");
    if (!confirm) next.confirm = t("validation.confirmPasswordRequired");
    else if (password && confirm !== password) {
      next.confirm = t("validation.passwordMismatch");
    }

    if (Object.keys(next).length) {
      setErrors(next);
      notify.error(t("validation.formInvalid"));
      return;
    }

    setSubmitting(true);
    // TODO: apiPost("/admin/reset-password", { token, password })
    setSubmitting(false);
    notify.success(t("auth.resetSuccess"));
    navigate("/admin/login", { replace: true });
  };

  if (!token) {
    return (
      <>
        <h4 className="auth-title mb-1">{t("auth.resetTitle")}</h4>
        <p className="auth-subtitle mb-4 text-danger">{t("validation.resetTokenMissing")}</p>
        <Link to="/admin/forgot-password" className="btn btn-primary d-grid w-100">
          {t("auth.sendReset")}
        </Link>
        <div className="text-center mt-3">
          <Link to="/admin/login"><small>{t("auth.backToLogin")}</small></Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h4 className="auth-title mb-1">{t("auth.resetTitle")}</h4>
      <p className="auth-subtitle mb-4">{t("auth.resetHint")}</p>

      <form onSubmit={onSubmit} noValidate>
        <FormField label={t("auth.newPassword")} htmlFor="new-password" error={errors.password}>
          <PasswordInput
            id="new-password"
            value={password}
            invalid={!!errors.password}
            placeholder={t("auth.newPasswordPlaceholder")}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((p) => ({ ...p, password: "" }));
            }}
          />
        </FormField>

        <FormField label={t("auth.confirmPassword")} htmlFor="confirm-password" error={errors.confirm}>
          <PasswordInput
            id="confirm-password"
            value={confirm}
            invalid={!!errors.confirm}
            placeholder={t("auth.confirmPasswordPlaceholder")}
            onChange={(e) => {
              setConfirm(e.target.value);
              setErrors((p) => ({ ...p, confirm: "" }));
            }}
          />
        </FormField>

        <button className="btn btn-primary d-grid w-100" disabled={submitting}>
          {submitting ? "..." : t("auth.resetSubmit")}
        </button>
      </form>

      <div className="text-center mt-3">
        <Link to="/admin/login"><small>{t("auth.backToLogin")}</small></Link>
      </div>
    </>
  );
}
