import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Controlled Bootstrap modal (render only when open).
 * <Modal title="Add" onClose={close} footer={<button .../>}>body</Modal>
 * Pass `as="form"` + `onSubmit` so footer submit button submits the body fields.
 */
export default function Modal({ title, onClose, children, footer, size = "", as: Tag = "div", onSubmit, busy = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [onClose, busy]);

  return createPortal(
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" tabIndex={-1} onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose?.();
      }}>
        <div className={`modal-dialog modal-dialog-centered ${size ? `modal-${size}` : ""}`}>
          <Tag className="modal-content" onSubmit={onSubmit} noValidate={Tag === "form" ? true : undefined}>
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} disabled={busy} />
            </div>
            <div className="modal-body">{children}</div>
            {footer ? <div className="modal-footer">{footer}</div> : null}
          </Tag>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>,
    document.body
  );
}
