import { useState } from "react";
import { Calendar } from "react-date-range";
import { FiCalendar } from "react-icons/fi";
import {
  formatDateTime,
  parseLocalIsoDate,
  toLocalIsoDate,
  toLocalIsoTime,
} from "../../utils/custom";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function DateTimePicker({
  date,
  time,
  onChange,
  showDate = true,
  showTime = true,
  label = "Date and time",
  placeholder = "Select date and time",
}) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(date || toLocalIsoDate());
  const [draftTime, setDraftTime] = useState(time || toLocalIsoTime());

  const display =
    date || time
      ? formatDateTime(date || "", showTime ? time || "" : "")
      : placeholder;

  return (
    <div className="ls-datetime">
      {label ? <label className="form-label">{label}</label> : null}
      <button
        type="button"
        className="form-control ls-datetime__trigger text-start"
        onClick={() => {
          setDraftDate(date || toLocalIsoDate());
          setDraftTime(time || toLocalIsoTime());
          setOpen((v) => !v);
        }}
      >
        <FiCalendar className="me-2" />
        {display}
      </button>

      {open ? (
        <div className="ls-datetime__popover card shadow border-0 p-2">
          {showDate ? (
            <Calendar
              date={parseLocalIsoDate(draftDate)}
              onChange={(d) => setDraftDate(toLocalIsoDate(d))}
              color="#696cff"
            />
          ) : null}
          {showTime ? (
            <div className="mt-2">
              <label className="form-label">Time</label>
              <input
                type="time"
                className="form-control"
                value={draftTime || ""}
                onChange={(e) => setDraftTime(e.target.value)}
              />
            </div>
          ) : null}
          <div className="d-flex justify-content-end gap-2 mt-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => {
                onChange({
                  date: showDate ? draftDate : date,
                  time: showTime ? draftTime : time,
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