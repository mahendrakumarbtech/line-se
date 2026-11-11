import { getPageItems, getTotalPages } from "../../utils/custom";

export default function ListPaginationBar({
  page,
  onPageChange,
  total = 0,
  pageSize = 10,
  totalPages,
  loading = false,
  ariaLabel = "Pagination",
}) {
  const pages = totalPages != null ? totalPages : getTotalPages(total, pageSize);
  const safePage = Math.min(Math.max(1, Number(page) || 1), pages);
  const from = total > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const to = Math.min(safePage * pageSize, total);
  const atStart = safePage <= 1 || loading;
  const atEnd = safePage >= pages || loading;

  const go = (n) => {
    const next = Math.min(Math.max(1, n), pages);
    if (next === safePage || loading) return;
    onPageChange?.(next);
  };

  const navButton = (label, target, disabled) => (
    <li className={`page-item ${disabled ? "disabled" : ""}`} key={label}>
      <button type="button" className="page-link" onClick={() => go(target)} disabled={disabled}>
        {label}
      </button>
    </li>
  );

  return (
    <div className="ls-pager d-flex align-items-center justify-content-between flex-wrap gap-2 px-3 py-3">
      {total > 0 ? (
        <span className="text-muted-ls small">
          Showing <strong className="text-heading">{from}</strong> to{" "}
          <strong className="text-heading">{to}</strong> of{" "}
          <strong className="text-heading">{total}</strong> results
        </span>
      ) : (
        <span className="text-muted-ls small">0 results</span>
      )}
      {total > 0 ? (
        <nav aria-label={ariaLabel}>
          <ul className="pagination pagination-sm mb-0">
            {navButton("«", 1, atStart)}
            {navButton("‹", safePage - 1, atStart)}
            {getPageItems(pages, safePage).map((p, idx) =>
              p === "…" ? (
                <li className="page-item disabled" key={`e-${idx}`}>
                  <span className="page-link">…</span>
                </li>
              ) : (
                <li className={`page-item ${safePage === p ? "active" : ""}`} key={`p-${p}`}>
                  <button type="button" className="page-link" onClick={() => go(p)} disabled={loading}>{p}</button>
                </li>
              )
            )}
            {navButton("›", safePage + 1, atEnd)}
            {navButton("»", pages, atEnd)}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
