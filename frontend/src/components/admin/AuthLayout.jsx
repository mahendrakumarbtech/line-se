import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../../i18n";
import { APP_LANGUAGES } from "../../utils/custom";
import "../../styles/admin/auth.css";

export default function AuthLayout() {
  const { i18n } = useTranslation();

  return (
    <div className="auth-wrapper d-flex align-items-center justify-content-center min-vh-100 p-3">
      <div className="auth-card card border-0 w-100 position-relative">
        <div className="position-absolute top-0 end-0 p-3">
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            value={i18n.language}
            onChange={(e) => setAppLanguage(e.target.value)}
            aria-label="Language"
          >
            {APP_LANGUAGES.map((l) => (
              <option key={l.key} value={l.key}>{l.label}</option>
            ))}
          </select>
        </div>
        <div className="card-body p-4 p-sm-5">
          <Outlet />
        </div>
      </div>
    </div>
  );
}