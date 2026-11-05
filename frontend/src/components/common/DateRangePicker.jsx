import { useState } from "react";
import { DateRange } from "react-date-range";
import { FiCalendar } from "react-icons/fi";
import { formatDate, parseLocalIsoDate, toLocalIsoDate } from "../../utils/custom";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function DateRangePicker({
  dateFrom,
  dateTo,
  onChange,
  label = "Date range",
  placeholder = "Select dates",
}) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState([
    {
      startDate: parseLocalIsoDate(dateFrom || toLocalIsoDate()),
      endDate: parseLocalIsoDate(dateTo || toLocalIsoDate()),
      key: "selection",
    },
  ]);

  const display =
    dateFrom && dateTo
      ? `${formatDate(dateFrom)} – ${formatDate(dateTo)}`
      : placeholder;

  return (
    <div className="ls-daterange">
      {label ? <label className="form-label">{label}</label> : null}
      <button
        type="button"
        className="form-control ls-daterange__trigger text-start"
        onClick={() => setOpen((v) => !v)}
      >
        <FiCalendar className="me-2" />
        {display}
      </button>

      {open ? (
        <div className="ls-daterange__popover card shadow border-0 p-2">
          <DateRange
            ranges={range}
            onChange={(item) => setRange([item.selection])}
            moveRangeOnFirstSelection={false}
            rangeColors={["#696cff"]}
          />
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => {
                onChange({
                  dateFrom: toLocalIsoDate(range[0].startDate),
                  dateTo: toLocalIsoDate(range[0].endDate),
                });
                setOpen(false);
              }}
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}