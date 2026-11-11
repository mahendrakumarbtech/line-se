import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBriefcase, FiCheckCircle, FiUsers, FiActivity } from "react-icons/fi";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { apiPost } from "../../services/api";
import { canAccess, LIMIT_PER_PAGE } from "../../utils/custom";

export default function Dashboard() {
  const { user, token } = useAdminAuth();
  const [orgTotal, setOrgTotal] = useState(null);
  const [orgActive, setOrgActive] = useState(null);

  useEffect(() => {
    if (!token || !canAccess(user, "organization.view")) return;
    let alive = true;
    (async () => {
      const [allRes, activeRes] = await Promise.all([
        apiPost("/admin/organizations/index", { page: 1, limit: LIMIT_PER_PAGE, filter: {} }, { token }),
        apiPost("/admin/organizations/index", { page: 1, limit: 1, filter: { status: 1 } }, { token }),
      ]);
      if (!alive) return;
      if (allRes?.status === 1) setOrgTotal(allRes.data?.total ?? 0);
      if (activeRes?.status === 1) setOrgActive(activeRes.data?.total ?? 0);
    })();
    return () => {
      alive = false;
    };
  }, [token, user]);

  const firstName = String(user?.name || "Admin").split(" ")[0];

  const stats = [
    { label: "Organizations", value: orgTotal, icon: FiBriefcase, tone: "primary" },
    { label: "Active Orgs", value: orgActive, icon: FiCheckCircle, tone: "success" },
    { label: "Role", value: user?.role?.name, icon: FiUsers, tone: "info", fontSize: "1.15rem" },
    { label: "Account", value: user?.email, icon: FiActivity, tone: "warning", fontSize: "1.05rem" },
  ];

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card dash-welcome">
          <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h4>Welcome back, {firstName}! 🎉</h4>
              <p className="mb-3 text-muted-ls">
                LineSe admin panel — manage organizations, users, and queue operations from one place.
              </p>
              {canAccess(user, "organization.view") ? (
                <Link to="/admin/organizations" className="btn btn-sm btn-primary">
                  View Organizations
                </Link>
              ) : null}
            </div>
            <div className="d-none d-md-flex align-items-center justify-content-center bg-label-primary rounded-3 px-4 py-3">
              <FiActivity size={42} />
            </div>
          </div>
        </div>
      </div>

      {stats.map(({ label, value, icon: Icon, tone, fontSize }) => (
        <div className="col-sm-6 col-xl-3" key={label}>
          <div className="card h-100">
            <div className="card-body">
              <div className={`dash-stat-icon bg-label-${tone} mb-3`}><Icon /></div>
              <span className="d-block text-muted-ls mb-1">{label}</span>
              <span className="stat-value text-break" style={fontSize ? { fontSize } : undefined}>
                {value ?? "—"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
