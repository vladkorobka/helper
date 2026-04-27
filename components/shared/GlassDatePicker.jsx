'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];
const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

function parseYMD(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1; // Mon=0 … Sun=6

  const days = [];

  for (let i = startDow; i > 0; i--) {
    days.push({ date: new Date(year, month, 1 - i), curr: false });
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(year, month, d), curr: true });
  }

  let nextDay = 1;
  while (days.length % 7 !== 0 || days.length < 35) {
    days.push({ date: new Date(year, month + 1, nextDay++), curr: false });
  }

  return days;
}

const NAV_BTN_STYLE = { background: 'rgba(255,255,255,0)' };

export default function GlassDatePicker({ value, onChange }) {
  const selectedDate = parseYMD(value);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    selectedDate ? selectedDate.getFullYear() : today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? selectedDate.getMonth() : today.getMonth(),
  );
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleOpen = () => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
    setOpen((v) => !v);
  };

  const prevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  };
  const nextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  };

  const handleSelect = (date, curr) => {
    if (!curr) {
      setViewYear(date.getFullYear());
      setViewMonth(date.getMonth());
    }
    onChange(formatYMD(date));
    setOpen(false);
  };

  const days = buildCalendar(viewYear, viewMonth);
  const todayYMD = formatYMD(today);

  const displayValue = selectedDate
    ? `${String(selectedDate.getDate()).padStart(2, '0')}.${String(selectedDate.getMonth() + 1).padStart(2, '0')}.${selectedDate.getFullYear()}`
    : '';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="input flex items-center justify-between w-full"
      >
        <span className={displayValue ? '' : 'text-gray-400'}>
          {displayValue || 'Wybierz datę...'}
        </span>
        <CalendarDaysIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div
          className="absolute top-full mt-1 left-0 z-30 p-4 w-72"
          style={{
            background: 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.94)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(59,130,246,0.13)',
          }}
        >
          {/* Month / Year nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 transition"
              style={NAV_BTN_STYLE}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.7)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0)')}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-800 select-none">
              {MONTHS_PL[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 transition"
              style={NAV_BTN_STYLE}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.7)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0)')}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide py-1"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map(({ date, curr }, i) => {
              const ymd = formatYMD(date);
              const isSelected = value === ymd;
              const isToday = todayYMD === ymd;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(date, curr)}
                  className={`py-1.5 text-xs rounded-lg font-medium transition select-none ${
                    isSelected
                      ? 'text-white shadow-sm'
                      : curr
                      ? isToday
                        ? 'text-blue-600 font-bold'
                        : 'text-gray-700'
                      : 'text-gray-300'
                  }`}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg,#3b82f6,#2563eb)'
                      : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(219,234,254,0.8)';
                      e.currentTarget.style.color = '#1d4ed8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '';
                      e.currentTarget.style.color = '';
                    }
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
