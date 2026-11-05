import { useMemo, useRef } from "react";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { useAsyncSelect } from "../../hooks/useAsyncSelect";
import { fetchAjaxListOptions } from "../../services/ajaxList";

function toOptions(options = []) {
  return options.map((o) =>
    o.value != null ? o : { value: o.id, label: o.text, raw: o }
  );
}

/**
 * One select for constants list OR ajax-list.
 * Static: <AsyncSearchSelect options={STATUS_OPTIONS} value={v} onChange={setV} />
 * Ajax:   <AsyncSearchSelect ajaxType="roles" value={v} onChange={setV} />
 */
export default function AsyncSearchSelect({
  options,
  ajaxType,
  value,
  onChange,
  isMulti = false,
  isClearable = true,
  isDisabled = false,
  placeholder = "Select...",
  ...rest
}) {
  const defaultListFetchedRef = useRef(false);

  const fetchOptions = useMemo(() => {
    if (!ajaxType) return null;
    return ({ search, ids }) =>
      fetchAjaxListOptions({ type: ajaxType, q: search, id: ids });
  }, [ajaxType]);

  const asyncState = useAsyncSelect({
    fetchOptions: fetchOptions || (async () => []),
    value,
    isMulti,
    enabled: Boolean(ajaxType),
  });

  if (ajaxType) {
    return (
      <AsyncSelect
        classNamePrefix="ls-select"
        isMulti={isMulti}
        isClearable={isClearable}
        isDisabled={isDisabled}
        isLoading={asyncState.isLoading}
        cacheOptions
        defaultOptions={asyncState.defaultOptions}
        loadOptions={asyncState.loadOptions}
        value={asyncState.resolvedValue}
        onChange={(opt) =>
          onChange(isMulti ? (opt || []).map((x) => x.value) : opt?.value ?? null)
        }
        placeholder={placeholder}
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
        menuPosition="fixed"
        onMenuOpen={() => {
          if (!defaultListFetchedRef.current) {
            defaultListFetchedRef.current = true;
            asyncState.loadOptions("");
          }
        }}
        {...rest}
      />
    );
  }

  const opts = toOptions(options || []);
  const selected = isMulti
    ? opts.filter((o) => (value || []).map(String).includes(String(o.value)))
    : opts.find((o) => String(o.value) === String(value)) || null;

  return (
    <Select
      classNamePrefix="ls-select"
      options={opts}
      value={selected}
      onChange={(opt) =>
        onChange(isMulti ? (opt || []).map((x) => x.value) : opt?.value ?? null)
      }
      isMulti={isMulti}
      isClearable={isClearable}
      isDisabled={isDisabled}
      placeholder={placeholder}
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      menuPosition="fixed"
      {...rest}
    />
  );
}