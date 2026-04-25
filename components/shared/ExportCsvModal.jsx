'use client';
import { useState } from 'react';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { getErrorMessage } from '../../lib/utils.js';
import CustomSelect from '../ui/CustomSelect.jsx';

const MONTHS = [
  { value: '01', label: 'Styczeń' },
  { value: '02', label: 'Luty' },
  { value: '03', label: 'Marzec' },
  { value: '04', label: 'Kwiecień' },
  { value: '05', label: 'Maj' },
  { value: '06', label: 'Czerwiec' },
  { value: '07', label: 'Lipiec' },
  { value: '08', label: 'Sierpień' },
  { value: '09', label: 'Wrzesień' },
  { value: '10', label: 'Październik' },
  { value: '11', label: 'Listopad' },
  { value: '12', label: 'Grudzień' },
];

function buildYears() {
  const y = new Date().getFullYear();
  return [y - 2, y - 1, y, y + 1].map((n) => ({ value: String(n), label: String(n) }));
}

export default function ExportCsvModal({ onClose }) {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tickets/export?date=${month}-${year}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `raport ${year}-${month}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-auth-card p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-bold text-gray-800">Eksport do CSV</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition rounded-md hover:bg-white/50"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-5">Wybierz miesiąc i rok raportu</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Miesiąc</label>
            <CustomSelect value={month} onChange={setMonth} options={MONTHS} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Rok</label>
            <CustomSelect value={year} onChange={setYear} options={buildYears()} />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost">Anuluj</button>
          <button onClick={handleExport} disabled={loading} className="btn-primary">
            <ArrowDownTrayIcon className="h-4 w-4" />
            {loading ? 'Pobieranie...' : 'Pobierz CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
