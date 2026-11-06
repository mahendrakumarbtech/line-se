import { useState, useCallback } from "react";

export default function useFormErrors(initial = {}) {
  const [errors, setErrors] = useState(initial);
  const clearField = useCallback((name) => {
    setErrors((p) => ({ ...p, [name]: "" }));
  }, []);
  const clearAll = useCallback(() => setErrors({}), []);
  return { errors, setErrors, clearField, clearAll };
}