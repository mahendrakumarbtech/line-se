import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiBell,
  FiCheck,
  FiGlobe,
  FiLogOut,
  FiMenu,
  FiMonitor,
  FiMoon,
  FiSearch,
  FiSun,
} from "react-icons/fi";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { setAppLanguage } from "../../i18n";
import {
  APP_LANGUAGES,
  getInitials,
  getTheme,
  setTheme,
  THEME_OPTIONS,
  watchSystemTheme,
} from "../../utils/custom";

const THEME_ICONS = { light: FiSun, dark: FiMoon, system: FiMonitor };

function NavDropdown({ icon: Icon, label, menuClassName = "", dot = false, children }) {
  return (
    <div className="dropdown">
      <button
        type="button"
        className="nav-icon-btn dropdown-toggle hide-arrow"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        aria-label={label}
        title={label}
      >
        <Icon />
        {dot ? <span className="nav-dot" /> : null}
      </button>
      <div className={`dropdown-menu dropdown-menu-end navbar-dropdown ${menuClassName}`}>{children}</div>
    </div>
  );
}

function OptionItems({ options, active, onSelect, icons }) {
  return options.map((o) => {
    const Icon = icons?.[o.key];
    return (
      <button
        key={o.key}
        type="button"
        className={`dropdown-item d-flex align-items-center gap-2 ${active === o.key ? "active" : ""}`}
        onClick={() => onSelect(o.key)}
      >
        {Icon ? <Icon /> : null}
        <span className="flex-grow-1">{o.label}</span>
        {active === o.key ? <FiCheck /> : null}
      </button>
    );
  });
}

export default function AdminNavbar({ onOpenMobileMenu, notifications = [] }) {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [theme, setThemeState] = useState(getTheme);

  useEffect(() => watchSystemTheme(), []);

  const onThemeChange = (key) => {
    setTheme(key);
    setThemeState(key);
  };

  const onLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const initials = getInitials(user?.name);
  const roleName = user?.role?.name || "Admin";

  return (
    <nav className="layout-navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="nav-icon-btn d-lg-none"
          aria-label="Open menu"
          onClick={onOpenMobileMenu}
        >
          <FiMenu />
        </button>
        <span className="navbar-search">
          <FiSearch /> Search
        </span>
      </div>

      <div className="navbar-right">
        <NavDropdown icon={FiGlobe} label="Language">
          <OptionItems options={APP_LANGUAGES} active={i18n.language} onSelect={setAppLanguage} />
        </NavDropdown>

        <NavDropdown icon={THEME_ICONS[theme]} label="Theme">
          <OptionItems options={THEME_OPTIONS} active={theme} onSelect={onThemeChange} icons={THEME_ICONS} />
        </NavDropdown>

        <NavDropdown
          icon={FiBell}
          label="Notifications"
          menuClassName="dropdown-notifications"
          dot={notifications.length > 0}
        >
          <div className="dropdown-menu-header">
            <h6>Notification</h6>
            {notifications.length ? (
              <span className="badge rounded-pill bg-label-primary">{notifications.length} New</span>
            ) : null}
          </div>
          {notifications.length ? (
            notifications.map((n) => (
              <div key={n.id} className="dropdown-item">
                <div className="fw-medium text-heading">{n.title}</div>
                <small className="text-muted-ls">{n.message}</small>
              </div>
            ))
          ) : (
            <div className="notification-empty">
              <FiBell />
              <div>No new notifications</div>
            </div>
          )}
        </NavDropdown>

        <div className="dropdown">
          <button
            type="button"
            className="navbar-user dropdown-toggle hide-arrow"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            aria-label="Profile"
          >
            <span className="navbar-avatar">{initials}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end navbar-dropdown" style={{ minWidth: "14rem" }}>
            <li>
              <div className="d-flex align-items-center gap-3 px-3 py-2">
                <span className="navbar-avatar">{initials}</span>
                <div className="navbar-user-meta">
                  <span className="name text-truncate">{user?.name || "Admin"}</span>
                  <span className="role">{roleName}</span>
                </div>
              </div>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button type="button" className="dropdown-item d-flex align-items-center gap-2" onClick={onLogout}>
                <FiLogOut /> Log Out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
