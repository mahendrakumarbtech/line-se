import { useEffect, useState } from "react";
import { apiPost } from "../../../services/api";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { canAccess, LIMIT_PER_PAGE } from "../../../utils/custom";

export default function OrganizationsIndex() {
  const { token, user } = useAdminAuth();
  const canManageDelete = canAccess(user, "organization.manage-delete");

  const [tab, setTab] = useState("active"); // active | trashed
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const body = {
      filter: {
        search,
        ...(tab === "trashed" ? { trashed: true } : {}),
      },
      page,
      limit: LIMIT_PER_PAGE,
    };
    const res = await apiPost("/admin/organizations/index", body, { token });
    setLoading(false);
    if (res?.status !== 1) {
      setError(res?.message || "Failed to load");
      setRows([]);
      setTotal(0);
      return;
    }
    setRows(res.data?.organizations || []);
    setTotal(res.data?.total || 0);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, token]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div>
      <h1>Organizations</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => { setTab("active"); setPage(1); }}
          style={{ fontWeight: tab === "active" ? 700 : 400 }}
        >
          Active
        </button>
        {canManageDelete ? (
          <button
            type="button"
            onClick={() => { setTab("trashed"); setPage(1); }}
            style={{ fontWeight: tab === "trashed" ? 700 : 400 }}
          >
            Deleted
          </button>
        ) : null}
      </div>

      <form onSubmit={onSearch} style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name / slug"
        />
        <button type="submit">Search</button>
      </form>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      {loading ? <p>Loading...</p> : null}

      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>ID</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && !loading ? (
            <tr><td colSpan={5}>No organizations</td></tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td>{row.slug}</td>
                <td>{row.type}</td>
                <td>{row.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span>Page {page} · Total {total}</span>
        <button
          type="button"
          disabled={page * LIMIT_PER_PAGE >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}