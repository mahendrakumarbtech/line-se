import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../../../components/common/Modal";
import FormField from "../../../components/common/FormField";
import AsyncSearchSelect from "../../../components/common/AsyncSearchSelect";
import { apiRequest } from "../../../services/api";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import {
  applyServerErrors,
  ORGANIZATION_TYPE_CODES,
  STATUS_OPTIONS,
  slugify,
  notify,
} from "../../../utils/custom";

/** row = null → add; row = list row → edit. onSaved() after success (list reloads). */
export default function OrganizationFormModal({ row, onClose, onSaved }) {
  const isEdit = Boolean(row?.id);
  const { t } = useTranslation();
  const { token } = useAdminAuth();
  const typeOptions = ORGANIZATION_TYPE_CODES.map((o) => ({ ...o, label: t(`orgType.${o.key}`) }));
  const statusOptions = STATUS_OPTIONS.map((s) => ({
    ...s,
    text: t(Number(s.id) === 1 ? "status.active" : "status.inactive"),
  }));

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
    if (!form.name.trim()) next.name = t("org.nameRequired");
    if (!form.slug.trim()) next.slug = t("org.slugRequired");
    if (form.type == null) next.type = t("org.typeRequired");
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setSubmitting(true);
    const res = await apiRequest(
      isEdit ? "/admin/organizations/edit" : "/admin/organizations/add",
      { ...(isEdit ? { id: row.id } : {}), ...form, name: form.name.trim(), slug: form.slug.trim() },
      { token }
    );
    setSubmitting(false);

    if (res?.status !== 1) {
      applyServerErrors(res, setErrors);
      notify.error(res?.message || t("org.saveFailed"));
      return;
    }
    notify.success(res.message || t(isEdit ? "success.ORG_UPDATED" : "success.ORG_CREATED"));
    onSaved?.();
  };

  return (
    <Modal
      as="form"
      onSubmit={onSubmit}
      title={t(isEdit ? "org.editTitle" : "org.add")}
      onClose={onClose}
      busy={submitting}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? t("common.saving") : t(isEdit ? "common.update" : "common.create")}
          </button>
        </>
      }
    >
      <FormField label={t("org.name")} htmlFor="org-name" error={errors.name}>
        <input
          id="org-name"
          autoFocus
          className={`form-control ${errors.name ? "is-invalid" : ""}`}
          value={form.name}
          onChange={(e) => {
            setField("name", e.target.value);
            if (!slugTouched) setField("slug", slugify(e.target.value));
          }}
          placeholder={t("org.namePlaceholder")}
        />
      </FormField>

      <FormField label={t("org.slug")} htmlFor="org-slug" error={errors.slug}>
        <input
          id="org-slug"
          className={`form-control ${errors.slug ? "is-invalid" : ""}`}
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setField("slug", slugify(e.target.value));
          }}
          placeholder={t("org.slugPlaceholder")}
        />
      </FormField>

      <div className="row">
        <div className="col-sm-6">
          <FormField label={t("org.type")} htmlFor="org-type" error={errors.type}>
            <AsyncSearchSelect
              inputId="org-type"
              options={typeOptions}
              value={form.type}
              placeholder={t("org.selectType")}
              onChange={(v) => setField("type", v)}
            />
          </FormField>
        </div>
        <div className="col-sm-6">
          <FormField label={t("org.status")} htmlFor="org-status" error={errors.status}>
            <AsyncSearchSelect
              inputId="org-status"
              options={statusOptions}
              value={form.status}
              isClearable={false}
              placeholder={t("org.selectStatus")}
              onChange={(v) => setField("status", v)}
            />
          </FormField>
        </div>
      </div>

      {errors.id ? <p className="text-danger small mb-0">{errors.id}</p> : null}
    </Modal>
  );
}
