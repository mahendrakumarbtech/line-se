import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { getLocal, setLocal, STORAGE_KEYS } from "../../utils/custom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import "../../styles/admin/admin.css";

export default function AdminLayout() {
  const { user } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(() => getLocal(STORAGE_KEYS.MENU_COLLAPSED) === "1");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 992) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setLocal(STORAGE_KEYS.MENU_COLLAPSED, next ? "1" : "0");
    setCollapsed(next);
  };

  return (
    <div className="layout-wrapper">
      {mobileOpen ? <div className="layout-overlay" onClick={() => setMobileOpen(false)} /> : null}

      <AdminSidebar
        user={user}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={toggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="layout-page">
        <AdminNavbar onOpenMobileMenu={() => setMobileOpen(true)} />

        <div className="content-wrapper">
          <div className="container-fluid flex-grow-1 container-p-y">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
