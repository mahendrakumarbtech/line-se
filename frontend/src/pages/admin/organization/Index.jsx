import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiChevronDown,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFilter,
  FiMoreVertical,
  FiPlus,
  FiRefreshCw,
  FiRotateCcw,
  FiToggleLeft,
  FiTrash2,
} from "react-icons/fi";
import ListPaginationBar from "../../../components/common/ListPaginationBar";
import AsyncSearchSelect from "../../../components/common/AsyncSearchSelect";
import Modal from "../../../components/common/Modal";
import FormField from "../../../components/common/FormField";
import OrganizationFormModal from "./FormModal";
import OrganizationViewModal from "./ViewModal";
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

const typeLabel = (value, t) => {
  const key = findLabel(ORGANIZATION_TYPE_CODES, value, { labelKey: "key" });
  return key && key !== value ? t(`orgType.${key}`) : value;
};
const statusLabel = (value, t) => t(Number(value) === 1 ? "status.active" : "status.inactive");

export default function OrganizationsIndex() {
  const { t } = useTranslation();
  const { token, user } = useAdminAuth();

  const canCreate = canAccess(user, "organization.create");
  const canUpdate = canAccess(user, "organization.update");
  const canDelete = canAccess(user, "organization.delete");
  const canChangeStatus = canAccess(user, "organization.change-status");
  const canManageDelete = canAccess(user, "organization.manage-delete");
  const statusOptions = STATUS_OPTIONS.map((s) => ({
    ...s,
    text: t(Number(s.id) === 1 ? "status.active" : "status.inactive"),
  }));

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
  const [viewRow, setViewRow] = useState(null);
  const [statusRow, setStatusRow] = useState(null);
  const [statusValue, setStatusValue] = useState(1);
  const [statusBusy, setStatusBusy] = useState(false);

  const isTrashed = tab === "trashed";
  const showActions = true;

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
    if (res?.status !== 1) notify.error(res?.message || t("org.exportFailed"));
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
      setError(res?.message || t("org.loadFailed"));
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
      title: t("org.deleteTitle", { name: row.name }),
      text: t("org.deleteText"),
      confirmText: t("org.delete"),
      cancelText: t("common.cancel"),
    });
    if (ok) runAction("/admin/organizations/delete", row, t("success.ORG_DELETED"), t("org.saveFailed"));
  };

  const onForceDelete = async (row) => {
    const ok = await confirmAction({
      title: t("org.deleteForeverTitle", { name: row.name }),
      text: t("org.deleteForeverText"),
      confirmText: t("org.deleteForever"),
      cancelText: t("common.cancel"),
    });
    if (ok) runAction("/admin/organizations/force-delete", row, t("success.ORG_PERMANENTLY_DELETED"), t("org.saveFailed"));
  };

  const onRestore = (row) =>
    runAction("/admin/organizations/restore", row, t("success.ORG_RESTORED"), t("org.saveFailed"));

  const openStatus = (row) => {
    setStatusValue(row.status ?? 1);
    setStatusRow(row);
  };

  const saveStatus = async (e) => {
    e.preventDefault();
    setStatusBusy(true);
    const res = await apiRequest(
      "/admin/organizations/change-status",
      { id: statusRow.id, status: statusValue },
      { token }
    );
    setStatusBusy(false);
    if (res?.status !== 1) {
      notify.error(res?.message || t("org.saveFailed"));
      return;
    }
    notify.success(res.message || t("success.ORG_STATUS_CHANGED"));
    setStatusRow(null);
    load();
  };

  const colSpan = showActions ? 6 : 5;

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h4 className="page-title">{t("org.title")}</h4>
        {canCreate ? (
          <button
            type="button"
            className={`btn btn-primary ${isTrashed ? "invisible" : ""}`}
            aria-hidden={isTrashed}
            tabIndex={isTrashed ? -1 : undefined}
            onClick={() => setFormRow(null)}
          >
            <FiPlus className="me-1" /> {t("org.add")}
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
                {t("status.active")}
              </button>
            </li>
            {canManageDelete ? (
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${isTrashed ? "active" : ""}`}
                  onClick={() => switchTab("trashed")}
                >
                  {t("org.deletedTab")}
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
              <FiFilter className="me-1" /> {t("org.filter")}
              <FiChevronDown className={`ms-1 ls-filter-chevron ${filterOpen ? "open" : ""}`} />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={load}
              disabled={loading}
            >
              <FiRefreshCw className={`me-1 ${loading ? "ls-spin" : ""}`} /> {t("org.refresh")}
            </button>
            <div className="dropdown">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary dropdown-toggle"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                disabled={loading || exporting || !total}
              >
                <FiDownload className={`me-1 ${exporting ? "ls-spin" : ""}`} /> {t("org.export")}
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
                <label className="form-label" htmlFor="org-filter-search">{t("org.search")}</label>
                <input
                  id="org-filter-search"
                  className="form-control"
                  value={draft.search}
                  onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
                  placeholder={t("org.searchPlaceholder")}
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label" htmlFor="org-filter-status">{t("org.status")}</label>
                <AsyncSearchSelect
                  inputId="org-filter-status"
                  options={statusOptions}
                  value={draft.status}
                  placeholder={t("common.all")}
                  onChange={(v) => setDraft((d) => ({ ...d, status: v }))}
                />
              </div>
              <div className="col-12 col-md-auto d-flex gap-2">
                <button type="submit" className="btn btn-primary">{t("common.apply")}</button>
                <button type="button" className="btn btn-outline-secondary" onClick={onResetFilters}>
                  {t("common.reset")}
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
                <th>{t("org.srNo")}</th>
                <th>{t("org.name")}</th>
                <th>{t("org.slug")}</th>
                <th>{t("org.type")}</th>
                <th>{t("org.status")}</th>
                {showActions ? <th className="text-end">{t("common.actions")}</th> : null}
              </tr>
            </thead>
            <tbody className="table-border-bottom-0">
              {loading && !rows.length ? (
                <tr><td colSpan={colSpan} className="text-center py-4 text-muted-ls">{t("common.loading")}</td></tr>
              ) : null}
              {!loading && !rows.length ? (
                <tr><td colSpan={colSpan} className="text-center py-4 text-muted-ls">{t("org.empty")}</td></tr>
              ) : null}
              {rows.map((row, idx) => (
                <tr key={row.id}>
                  <td>{(page - 1) * LIMIT_PER_PAGE + idx + 1}</td>
                  <td><span className="fw-medium text-heading">{row.name}</span></td>
                  <td>{row.slug}</td>
                  <td>{typeLabel(row.type, t)}</td>
                  <td>
                    <span className={`badge ${Number(row.status) === 1 ? "bg-label-success" : "bg-label-warning"} me-1`}>
                      {statusLabel(row.status, t)}
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
                          <button type="button" className="dropdown-item" onClick={() => setViewRow(row)}>
                            <FiEye className="me-1" /> {t("org.view")}
                          </button>
                          {!isTrashed && canUpdate ? (
                            <button type="button" className="dropdown-item" onClick={() => setFormRow(row)}>
                              <FiEdit2 className="me-1" /> {t("org.edit")}
                            </button>
                          ) : null}
                          {!isTrashed && canChangeStatus ? (
                            <button type="button" className="dropdown-item" onClick={() => openStatus(row)}>
                              <FiToggleLeft className="me-1" /> {t("org.changeStatus")}
                            </button>
                          ) : null}
                          {!isTrashed && canDelete ? (
                            <button type="button" className="dropdown-item text-danger" onClick={() => onSoftDelete(row)}>
                              <FiTrash2 className="me-1" /> {t("org.delete")}
                            </button>
                          ) : null}
                          {isTrashed ? (
                            <>
                              <button type="button" className="dropdown-item" onClick={() => onRestore(row)}>
                                <FiRotateCcw className="me-1" /> {t("org.restore")}
                              </button>
                              <button type="button" className="dropdown-item text-danger" onClick={() => onForceDelete(row)}>
                                <FiTrash2 className="me-1" /> {t("org.deleteForever")}
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

      {viewRow ? <OrganizationViewModal row={viewRow} onClose={() => setViewRow(null)} /> : null}

      {statusRow ? (
        <Modal
          as="form"
          title={t("org.changeStatusTitle")}
          onClose={() => !statusBusy && setStatusRow(null)}
          onSubmit={saveStatus}
          busy={statusBusy}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setStatusRow(null)} disabled={statusBusy}>
                {t("common.cancel")}
              </button>
              <button type="submit" className="btn btn-primary" disabled={statusBusy}>
                {statusBusy ? t("common.saving") : t("common.save")}
              </button>
            </>
          }
        >
          <p className="text-heading fw-medium mb-3">{statusRow.name}</p>
          <FormField label={t("org.status")} htmlFor="org-change-status">
            <AsyncSearchSelect
              inputId="org-change-status"
              options={statusOptions}
              value={statusValue}
              isClearable={false}
              onChange={(v) => setStatusValue(v)}
            />
          </FormField>
        </Modal>
      ) : null}
    </>
  );
}
