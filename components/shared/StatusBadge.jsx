'use client';
const STATUS_CONFIG = {
  waiting: { label: 'Oczekujące', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  invoiced: { label: 'Zafakturowane', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  sent: { label: 'Wysłane', className: 'bg-green-100 text-green-700 border-green-200' },
};

export default function StatusBadge({ status, compact = false }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-600 border-gray-200' };

  if (compact) {
    const dots = {
      waiting: 'bg-amber-400',
      invoiced: 'bg-blue-400',
      sent: 'bg-green-400',
    };
    return (
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${dots[status] || 'bg-gray-400'}`}
        title={config.label}
      />
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
