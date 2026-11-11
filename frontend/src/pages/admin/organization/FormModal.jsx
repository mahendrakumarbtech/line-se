import { useState } from "react";
import Modal from "../../../components/common/Modal";
import FormField from "../../../components/common/FormField";
import AsyncSearchSelect from "../../../components/common/AsyncSearchSelect";
import { notify } from "../../../components/common/toast";
import { apiPost } from "../../../services/api";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import {
  applyServerErrors,
  ORGANIZATION_TYPE_CODES,
  STATUS_OPTIONS,
  slugify,
} from "../../../utils/custom";

/** row = null → add; row = list row → edit. onSaved() after success (list reloads). */
export default function OrganizationFormModal({ row, onClose, onSaved }) {
  const isEdit = Boolean(row?.id);
  const { token } = useAdminAuth();

  const [form, setForm] = useState(() => ({
    name: row?.name || "",
    slug: row?.slug || "",
    type: row?.type ?? null,
    status: row?.status ?? 1,
  }));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.slug.trim()) next.slug = "Slug is required";
    if (form.type == null) next.type = "Type is required";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setSubmitting(true);
    const res = await apiPost(
      isEdit ? "/admin/organizations/edit" : "/admin/organizations/add",
      { ...(isEdit ? { id: row.id } : {}), ...form, name: form.name.trim(), slug: form.slug.trim() },
      { token }
    );
    setSubmitting(false);

    if (res?.status !== 1) {
      applyServerErrors(res, setErrors);
      notify.error(res?.message || "Save failed");
      return;
    }
    notify.success(res.message || (isEdit ? "Organization updated" : "Organization created"));
    onSaved?.();
  };

  return (
    <Modal
      as="form"
      onSubmit={onSubmit}
      title={isEdit ? "Edit Organization" : "Add Organization"}
      onClose={onClose}
      busy={submitting}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </>
      }
    >
      <FormField label="Name" htmlFor="org-name" error={errors.name}>
        <input
          id="org-name"
          autoFocus
          className={`form-control ${errors.name ? "is-invalid" : ""}`}
          value={form.name}
          onChange={(e) => {
            setField("name", e.target.value);
            if (!slugTouched) setField("slug", slugify(e.target.value));
          }}
          placeholder="Organization name"
        />
      </FormField>

      <FormField label="Slug" htmlFor="org-slug" error={errors.slug}>
        <input
          id="org-slug"
          className={`form-control ${errors.slug ? "is-invalid" : ""}`}
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setField("slug", slugify(e.target.value));
          }}
          placeholder="organization-slug"
        />
      </FormField>

      <div className="row">
        <div className="col-sm-6">
          <FormField label="Type" htmlFor="org-type" error={errors.type}>
            <AsyncSearchSelect
              inputId="org-type"
              options={ORGANIZATION_TYPE_CODES}
              value={form.type}
              placeholder="Select type"
              onChange={(v) => setField("type", v)}
            />
          </FormField>
        </div>
        <div className="col-sm-6">
          <FormField label="Status" htmlFor="org-status" error={errors.status}>
            <AsyncSearchSelect
              inputId="org-status"
              options={STATUS_OPTIONS}
              value={form.status}
              isClearable={false}
              placeholder="Select status"
              onChange={(v) => setField("status", v)}
            />
          </FormField>
        </div>
      </div>

      {errors.id ? <p className="text-danger small mb-0">{errors.id}</p> : null}
    </Modal>
  );
}
