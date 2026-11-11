import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../../i18n";
import { APP_LANGUAGES } from "../../utils/custom";
import AsyncSearchSelect from "../common/AsyncSearchSelect";
import "../../styles/admin/auth.css";

export default function AuthLayout() {
  const { i18n } = useTranslation();

  return (
    <div className="auth-wrapper d-flex align-items-center justify-content-center min-vh-100 p-3">
      <div className="auth-card card border-0 w-100 position-relative">
        <div className="position-absolute top-0 end-0 p-3">
          <div style={{ minWidth: "9rem" }}>
            <AsyncSearchSelect
              aria-label="Language"
              options={APP_LANGUAGES}
              value={i18n.language}
              isClearable={false}
              isSearchable={false}
              onChange={setAppLanguage}
            />
          </div>
        </div>
        <div className="card-body p-4 p-sm-5">
          <Outlet />
        </div>
      </div>
    </div>
  );
}