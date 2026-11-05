import { NavLink, Outlet } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import "../../styles/admin/admin.css";

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();

  const linkStyle = ({ isActive }) => ({
    display: "block",
    padding: "8px 12px",
    textDecoration: "none",
    color: isActive ? "#fff" : "#333",
    background: isActive ? "#333" : "transparent",
    borderRadius: 4,
    marginBottom: 4,
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, padding: 16, borderRight: "1px solid #ddd" }}>
        <strong>LineSe Admin</strong>
        <nav style={{ marginTop: 16 }}>
          <NavLink to="/admin/dashboard" style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/admin/organizations" style={linkStyle}>Organizations</NavLink>
        </nav>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 12,
            padding: "12px 20px",
            borderBottom: "1px solid #ddd",
          }}
        >
          <span>{user?.name}</span>
          <button type="button" onClick={logout}>Logout</button>
        </header>
        <main style={{ padding: 20 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}