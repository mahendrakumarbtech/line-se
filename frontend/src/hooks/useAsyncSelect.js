import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function mergeSelectOptions(existing = [], incoming = []) {
  const map = new Map();
  [...existing, ...incoming].forEach((o) => {
    if (o?.value == null || o.value === "") return;
    map.set(String(o.value), o);
  });
  return [...map.values()];
}

export function useAsyncSelect({ fetchOptions, value, isMulti = false, enabled = true }) {
  const [cache, setCache] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchRef = useRef(fetchOptions);
  fetchRef.current = fetchOptions;

  const selectedIds = useMemo(() => {
    if (isMulti) {
      return [...new Set((Array.isArray(value) ? value : []).map(String).filter(Boolean))];
    }
    const v = value != null && value !== "" ? String(value) : "";
    return v ? [v] : [];
  }, [value, isMulti]);

  const loadOptions = useCallback(
    (inputValue = "") => {
      if (!enabled) return Promise.resolve([]);
      const search = String(inputValue || "").trim();
      setLoading(true);
      return fetchRef
        .current({ search, ids: [] })
        .then((list) => {
          const arr = Array.isArray(list) ? list : [];
          setCache((prev) => mergeSelectOptions(prev, arr));
          return arr;
        })
        .catch(() => [])
        .finally(() => setLoading(false));
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled || !selectedIds.length) return;
    const missing = selectedIds.filter((id) => !cache.some((o) => String(o.value) === id));
    if (!missing.length) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const opts = await fetchRef.current({ search: "", ids: missing });
        if (!cancelled) setCache((prev) => mergeSelectOptions(prev, opts || []));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join("|"), enabled]);

  const resolvedValue = useMemo(() => {
    if (isMulti) {
      return selectedIds.map(
        (id) => cache.find((o) => String(o.value) === id) || { value: id, label: id }
      );
    }
    if (!selectedIds.length) return null;
    const id = selectedIds[0];
    return cache.find((o) => String(o.value) === id) || { value: id, label: id };
  }, [cache, selectedIds, isMulti]);

  return { loadOptions, resolvedValue, defaultOptions: cache, isLoading: loading };
}