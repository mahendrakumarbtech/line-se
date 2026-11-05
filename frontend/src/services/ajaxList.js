import { apiPost } from "./api";
import { getAdminToken } from "../utils/custom";

export function mapAjaxRowToOption(row) {
  const id = row?.id ?? row?.value;
  if (id == null || id === "") return null;
  return {
    value: id,
    label: String(row?.text ?? row?.label ?? id),
    raw: row,
  };
}

export async function fetchAjaxListOptions({ type, q = "", id = [], extra = {} } = {}) {
  const token = getAdminToken();
  const res = await apiPost(
    "/admin/ajax-list",
    { type, q, id: Array.isArray(id) ? id : id ? [id] : [], ...extra },
    { token }
  );
  if (res?.status !== 1) return [];
  const rows = res.data?.results || res.data || [];
  return rows.map(mapAjaxRowToOption).filter(Boolean);
}