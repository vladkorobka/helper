'use client';

const React = require('react');

const STATUS_CONFIG = {
  waiting: {
    label: 'Klient oczekuje na raport',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  sent: {
    label: 'Raport wysłany',
    className: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  invoiced: {
    label: 'Zlecenie zafakturowane',
    className: ' bg-teal-100 text-teal-700 border-teal-200',
  },
};

export default function StatusBadge({ status, compact = false }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const [isTooltip, setTooltip] = React.useState(false);

  if (compact) {
    const dots = {
      waiting: 'bg-amber-500',
      sent: 'bg-sky-500',
      invoiced: 'bg-teal-500',
    };
    return (
      <>
        <span
          className={`relative inline-block w-2.5 h-2.5 rounded-full ${dots[status] || 'bg-gray-400'}`}
          onMouseEnter={() => setTooltip(true)}
          onMouseLeave={() => setTooltip(false)}
        >
          {isTooltip && (
            <span className="inline-block absolute left-4 top-2 py-1 px-4 text-center text-xs text-white bg-gray-700 rounded-sm shadow-lg whitespace-nowrap">
              {STATUS_CONFIG[status]?.label || status}
            </span>
          )}
        </span>
      </>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
