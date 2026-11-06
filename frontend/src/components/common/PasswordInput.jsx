import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function PasswordInput({
  value,
  onChange,
  id = "password",
  className = "",
  invalid = false,
  ...rest
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="ls-password">
      <input
        id={id}
        className={`form-control pe-5 ${invalid ? "is-invalid" : ""} ${className}`.trim()}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        {...rest}
      />
      <button
        type="button"
        className="ls-password__toggle"
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  );
}