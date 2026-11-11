import { useTranslation } from "react-i18next";
import Modal from "../../../components/common/Modal";
import { findLabel, ORGANIZATION_TYPE_CODES } from "../../../utils/custom";

const typeKey = (value) => {
  const item = findLabel(ORGANIZATION_TYPE_CODES, value, { labelKey: "key" });
  return item && item !== value ? `orgType.${item}` : null;
};

const when = (value) => (value ? new Date(value).toLocaleString() : "");

export default function OrganizationViewModal({ row, onClose }) {
  const { t } = useTranslation();
  const type = typeKey(row.type);

  const fields = [
    ["org.name", row.name],
    ["org.slug", row.slug],
    ["org.type", type ? t(type) : row.type],
    ["org.status", t(Number(row.status) === 1 ? "status.active" : "status.inactive")],
    ["org.address", row.address],
    ["org.city", row.city],
    ["org.state", row.state],
    ["org.country", row.country],
    ["org.createdAt", when(row.createdAt)],
    ["org.updatedAt", when(row.updatedAt)],
  ].filter(([, value]) => value != null && value !== "");

  return (
    <Modal
      title={t("org.viewTitle")}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
          {t("common.close")}
        </button>
      }
    >
      <dl className="row mb-0">
        {fields.map(([key, value]) => (
          <div className="contents" key={key}>
            <dt className="col-sm-4 text-muted-ls fw-normal">{t(key)}</dt>
            <dd className="col-sm-8 text-heading">{value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
