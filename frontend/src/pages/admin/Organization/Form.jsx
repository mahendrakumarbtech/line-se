import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

const TYPE_OPTIONS = ORGANIZATION_TYPE_CODES.map((t) => ({
  value: t.value,
  label: t.label,
}));

export default function OrganizationForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { token } = useAdminAuth();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [type, setType] = useState(null);
  const [status, setStatus] = useState(1);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await apiPost("/admin/organizations/view", { id: Number(id) }, { token });
      if (!alive) return;
      setLoading(false);
      if (res?.status !== 1 || !res.data) {
        notify.error(res?.message || "Organization not found");
        navigate("/admin/organizations", { replace: true });
        return;
      }
      setName(res.data.name || "");
      setSlug(res.data.slug || "");
      setSlugTouched(true);
      setType(res.data.type ?? null);
      setStatus(res.data.status ?? 1);
    })();
    return () => {
      alive = false;
    };
  }, [id, isEdit, navigate, token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!name.trim()) next.name = "Name is required";
    if (!slug.trim()) next.slug = "Slug is required";
    if (type === null || type === undefined || type === "") next.type = "Type is required";
    if (Object.keys(next).length) {
      setErrors(next);
      notify.error("Please fill the required fields");
      return;
    }

    setSubmitting(true);
    const body = {
      ...(isEdit ? { id: Number(id) } : {}),
      name: name.trim(),
      slug: slug.trim(),
      type,
      status,
    };
    const res = await apiPost(
      isEdit ? "/admin/organizations/edit" : "/admin/organizations/add",
      body,
      { token }
    );
    setSubmitting(false);

    if (res?.status !== 1) {
      applyServerErrors(res, setErrors);
      notify.error(res?.message || "Please fill the required fields");
      return;
    }

    notify.success(res.message || (isEdit ? "Organization updated" : "Organization created"));
    navigate("/admin/organizations", { replace: true });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container-xxl flex-grow-1" style={{ maxWidth: 720 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">{isEdit ? "Edit Organization" : "Add Organization"}</h4>
        <Link to="/admin/organizations" className="btn btn-outline-secondary btn-sm">
          Back
        </Link>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <FormField label="Name" htmlFor="org-name" error={errors.name}>
          <input
            id="org-name"
            className={`form-control ${errors.name ? "is-invalid" : ""}`}
            value={name}
            onChange={(e) => {
              const v = e.target.value;
              setName(v);
              setErrors((p) => ({ ...p, name: "" }));
              if (!slugTouched) setSlug(slugify(v));
            }}
            placeholder="Organization name"
          />
        </FormField>

        <FormField label="Slug" htmlFor="org-slug" error={errors.slug}>
          <input
            id="org-slug"
            className={`form-control ${errors.slug ? "is-invalid" : ""}`}
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
              setErrors((p) => ({ ...p, slug: "" }));
            }}
            placeholder="organization-slug"
          />
        </FormField>

        <FormField label="Type" htmlFor="org-type" error={errors.type}>
          <AsyncSearchSelect
            inputId="org-type"
            options={TYPE_OPTIONS}
            value={type}
            placeholder="Select type"
            onChange={(v) => {
              setType(v);
              setErrors((p) => ({ ...p, type: "" }));
            }}
          />
        </FormField>

        <FormField label="Status" htmlFor="org-status" error={errors.status}>
          <AsyncSearchSelect
            inputId="org-status"
            options={STATUS_OPTIONS}
            value={status}
            isClearable={false}
            placeholder="Select status"
            onChange={(v) => {
              setStatus(v);
              setErrors((p) => ({ ...p, status: "" }));
            }}
          />
        </FormField>

        {errors.id ? <p className="text-danger small">{errors.id}</p> : null}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "..." : isEdit ? "Update" : "Create"}
        </button>
      </form>
    </div>
  );
}
