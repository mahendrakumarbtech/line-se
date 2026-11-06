export default function FormField({ label, htmlFor, error, children, hint }) {
  return (
    <div className="mb-3">
      {label ? <label className="form-label" htmlFor={htmlFor}>{label}</label> : null}
      {children}
      {error ? <div className="invalid-feedback d-block">{error}</div> : null}
      {!error && hint ? <div className="form-text">{hint}</div> : null}
    </div>
  );
}