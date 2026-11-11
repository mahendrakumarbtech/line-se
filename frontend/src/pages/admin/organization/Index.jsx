import { useEffect, useState } from "react";
import {
  FiChevronDown,
  FiDownload,
  FiEdit2,
  FiFilter,
  FiMoreVertical,
  FiPlus,
  FiRefreshCw,
  FiRotateCcw,
  FiTrash2,
} from "react-icons/fi";
import ListPaginationBar from "../../../components/common/ListPaginationBar";
import AsyncSearchSelect from "../../../components/common/AsyncSearchSelect";
import OrganizationFormModal from "./FormModal";
import { apiRequest } from "../../../services/api";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import {
  canAccess,
  EXPORT_TYPE_CODES,
  findLabel,
  LIMIT_PER_PAGE,
  ORGANIZATION_TYPE_CODES,
  STATUS_OPTIONS,
  notify,
  confirmAction,
} from "../../../utils/custom";

const EMPTY_FILTERS = { search: "", status: null };

const typeLabel = (value) => findLabel(ORGANIZATION_TYPE_CODES, value);
const statusLabel = (value) => findLabel(STATUS_OPTIONS, value, { valueKey: "id", labelKey: "text" });


export default function OrganizationsIndex() {
  const { token, user } = useAdminAuth();

  const canCreate = canAccess(user, "organization.create");
  const canUpdate = canAccess(user, "organization.update");
  const canDelete = canAccess(user, "organization.delete");
  const canManageDelete = canAccess(user, "organization.manage-delete");

  const [tab, setTab] = useState("active");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [formRow, setFormRow] = useState(undefined);

  const isTrashed = tab === "trashed";
  const showActions = isTrashed ? canManageDelete : canUpdate || canDelete;

  const buildFilter = () => ({
    search: filters.search || undefined,
    ...(filters.status != null ? { status: filters.status } : {}),
    ...(isTrashed ? { trashed: true } : {}),
  });

  const onExport = async (type) => {
    setExporting(true);
    const res = await apiRequest(
      "/admin/organizations/export",
      { filter: buildFilter(), type },
      { token, filename: `organizations-${tab}` }
    );
    setExporting(false);
    if (res?.status !== 1) notify.error(res?.message || "Export failed");
  };

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await apiRequest(
      "/admin/organizations/index",
      { filter: buildFilter(), page, limit: LIMIT_PER_PAGE },
      { token }
    );
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
  }, [page, filters, tab, token]);

  const switchTab = (next) => {
    setTab(next);
    setPage(1);
    setFilters(EMPTY_FILTERS);
    setDraft(EMPTY_FILTERS);
  };

  const onApplyFilters = (e) => {
    e.preventDefault();
    setFilters({ search: draft.search.trim(), status: draft.status });
    setPage(1);
  };

  const onResetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const runAction = async (url, row, fallbackSuccess, fallbackError) => {
    const res = await apiRequest(url, { id: row.id }, { token });
    if (res?.status !== 1) {
      notify.error(res?.message || fallbackError);
      return;
    }
    notify.success(res.message || fallbackSuccess);
    load();
  };

  const onSoftDelete = async (row) => {
    const ok = await confirmAction({
      title: `Delete "${row.name}"?`,
      text: "Organization will move to Deleted tab.",
      confirmText: "Delete",
    });
    if (ok) runAction("/admin/organizations/delete", row, "Organization deleted", "Delete failed");
  };

  const onForceDelete = async (row) => {
    const ok = await confirmAction({
      title: `Permanently delete "${row.name}"?`,
      text: "This cannot be undone.",
      confirmText: "Delete forever",
    });
    if (ok) runAction("/admin/organizations/force-delete", row, "Organization permanently deleted", "Delete failed");
  };

  const onRestore = (row) =>
    runAction("/admin/organizations/restore", row, "Organization restored", "Restore failed");

  const colSpan = showActions ? 6 : 5;

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h4 className="page-title">Organizations</h4>
        {canCreate ? (
          <button
            type="button"
            className={`btn btn-primary ${isTrashed ? "invisible" : ""}`}
            aria-hidden={isTrashed}
            tabIndex={isTrashed ? -1 : undefined}
            onClick={() => setFormRow(null)}
          >
            <FiPlus className="me-1" /> Add Organization
          </button>
        ) : null}
      </div>

      <div className="card">
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <ul className="nav nav-pills card-header-pills gap-1 mb-0">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${!isTrashed ? "active" : ""}`}
                onClick={() => switchTab("active")}
              >
                Active
              </button>
            </li>
            {canManageDelete ? (
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${isTrashed ? "active" : ""}`}
                  onClick={() => switchTab("trashed")}
                >
                  Deleted
                </button>
              </li>
            ) : null}
          </ul>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn btn-sm ${filterOpen ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setFilterOpen((v) => !v)}
            >
              <FiFilter className="me-1" /> Filter
              <FiChevronDown className={`ms-1 ls-filter-chevron ${filterOpen ? "open" : ""}`} />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={load}
              disabled={loading}
            >
              <FiRefreshCw className={`me-1 ${loading ? "ls-spin" : ""}`} /> Refresh
            </button>
            <div className="dropdown">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary dropdown-toggle"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                disabled={loading || exporting || !total}
              >
                <FiDownload className={`me-1 ${exporting ? "ls-spin" : ""}`} /> Export
              </button>
              <div className="dropdown-menu dropdown-menu-end">
                {EXPORT_TYPE_CODES.map((t) => (
                  <button key={t.key} type="button" className="dropdown-item" onClick={() => onExport(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {filterOpen ? (
          <form className="card-body border-bottom" onSubmit={onApplyFilters}>
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="org-filter-search">Search</label>
                <input
                  id="org-filter-search"
                  className="form-control"
                  value={draft.search}
                  onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
                  placeholder="Name / slug"
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label" htmlFor="org-filter-status">Status</label>
                <AsyncSearchSelect
                  inputId="org-filter-status"
                  options={STATUS_OPTIONS}
                  value={draft.status}
                  placeholder="All"
                  onChange={(v) => setDraft((d) => ({ ...d, status: v }))}
                />
              </div>
              <div className="col-12 col-md-auto d-flex gap-2">
                <button type="submit" className="btn btn-primary">Apply</button>
                <button type="button" className="btn btn-outline-secondary" onClick={onResetFilters}>
                  Reset
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {error ? <p className="text-danger px-4 pt-3 mb-0">{error}</p> : null}

        <div className="table-responsive text-nowrap">
          <table className="table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Type</th>
                <th>Status</th>
                {showActions ? <th className="text-end">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="table-border-bottom-0">
              {loading && !rows.length ? (
                <tr><td colSpan={colSpan} className="text-center py-4 text-muted-ls">Loading...</td></tr>
              ) : null}
              {!loading && !rows.length ? (
                <tr><td colSpan={colSpan} className="text-center py-4 text-muted-ls">No organizations</td></tr>
              ) : null}
              {rows.map((row, idx) => (
                <tr key={row.id}>
                  <td>{(page - 1) * LIMIT_PER_PAGE + idx + 1}</td>
                  <td><span className="fw-medium text-heading">{row.name}</span></td>
                  <td>{row.slug}</td>
                  <td>{typeLabel(row.type)}</td>
                  <td>
                    <span className={`badge ${Number(row.status) === 1 ? "bg-label-success" : "bg-label-warning"} me-1`}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  {showActions ? (
                    <td className="text-end">
                      <div className="dropdown">
                        <button
                          type="button"
                          className="btn p-0 dropdown-toggle hide-arrow ls-row-actions"
                          data-bs-toggle="dropdown"
                          data-bs-popper-config='{"strategy":"fixed"}'
                          aria-label="Actions"
                        >
                          <FiMoreVertical size={18} />
                        </button>
                        <div className="dropdown-menu dropdown-menu-end">
                          {!isTrashed && canUpdate ? (
                            <button type="button" className="dropdown-item" onClick={() => setFormRow(row)}>
                              <FiEdit2 className="me-1" /> Edit
                            </button>
                          ) : null}
                          {!isTrashed && canDelete ? (
                            <button type="button" className="dropdown-item text-danger" onClick={() => onSoftDelete(row)}>
                              <FiTrash2 className="me-1" /> Delete
                            </button>
                          ) : null}
                          {isTrashed ? (
                            <>
                              <button type="button" className="dropdown-item" onClick={() => onRestore(row)}>
                                <FiRotateCcw className="me-1" /> Restore
                              </button>
                              <button type="button" className="dropdown-item text-danger" onClick={() => onForceDelete(row)}>
                                <FiTrash2 className="me-1" /> Delete forever
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ListPaginationBar
          page={page}
          onPageChange={setPage}
          total={total}
          pageSize={LIMIT_PER_PAGE}
          loading={loading}
        />
      </div>

      {formRow !== undefined ? (
        <OrganizationFormModal
          key={formRow?.id ?? "new"}
          row={formRow}
          onClose={() => setFormRow(undefined)}
          onSaved={() => {
            setFormRow(undefined);
            load();
          }}
        />
      ) : null}
    </>
  );
}
