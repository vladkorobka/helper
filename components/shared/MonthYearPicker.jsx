'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import moment from 'moment';

const MONTHS = [
  'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
  'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru',
];

export default function MonthYearPicker({ value, onChange }) {
  const date = value instanceof Date ? value : new Date(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setViewYear(date.getFullYear());
    setOpen((v) => !v);
  };

  const handleSelect = (monthIdx) => {
    onChange(new Date(viewYear, monthIdx, 1));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition text-gray-700"
        style={{
          background: 'rgba(255,255,255,0.55)',
          border: '1px solid rgba(203,213,225,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
        {moment(date).format('MM/YYYY')}
      </button>

      {open && (
        <div
          className="absolute top-10 left-0 z-30 p-4 w-56"
          style={{
            background: 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.94)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(59,130,246,0.13)',
          }}
        >
          {/* Year nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 transition"
              style={{ background: 'rgba(255,255,255,0)', }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.7)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0)')}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-800 select-none tabular-nums">
              {viewYear}
            </span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 transition"
              style={{ background: 'rgba(255,255,255,0)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.7)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0)')}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((name, i) => {
              const isSelected =
                date.getFullYear() === viewYear && date.getMonth() === i;
              const isNow =
                new Date().getFullYear() === viewYear && new Date().getMonth() === i;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelect(i)}
                  className={`py-2 text-sm rounded-lg font-medium transition select-none ${
                    isSelected
                      ? 'text-white shadow-sm'
                      : isNow
                      ? 'text-blue-600 font-semibold'
                      : 'text-gray-700'
                  }`}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg,#3b82f6,#2563eb)'
                      : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = 'rgba(219,234,254,0.8)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '';
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
