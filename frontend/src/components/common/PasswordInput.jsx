import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function PasswordInput({ value, onChange, id = "password", ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-group">
      <input
        id={id}
        className="form-control"
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        {...rest}
      />
      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
      >
        {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  );
}