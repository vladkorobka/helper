'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { DayPicker } from 'react-day-picker';
import { pl } from 'react-day-picker/locale';
import 'react-day-picker/dist/style.css';
import moment from 'moment';
import Layout from '../../../components/layout/Layout.jsx';
import SortableHeader from '../../../components/shared/SortableHeader.jsx';
import StatusBadge from '../../../components/shared/StatusBadge.jsx';
import api from '../../../lib/api.js';
import { formatDateDisplay, formatDuration } from '../../../lib/utils.js';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  XMarkIcon,
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';

const SORT_KEY = 'helper_tickets_sort';
const FILTER_KEY = 'helper_tickets_filters';

const DEFAULT_FILTERS = {
  search: '',
  client: '',
  executor: '',
  status: '',
};

function getSaved(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(() => getSaved(FILTER_KEY, DEFAULT_FILTERS));
  const [sort, setSort] = useState(() => getSaved(SORT_KEY, { field: 'date', order: 'desc' }));
  const [month, setMonth] = useState(new Date());
  const [filterOpen, setFilterOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  // Load dropdowns once
  useEffect(() => {
    Promise.all([
      api.get('/clients/dropdown'),
      api.get('/employees/executors'),
    ]).then(([c, e]) => {
      setClients(c.data);
      setEmployees(e.data);
    });
  }, []);

  // Fetch tickets when filters/sort/month change
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({
      date: moment(month).format('MM-YYYY'),
      sortField: sort.field,
      sortOrder: sort.order,
    });
    if (filters.search) params.set('search', filters.search);
    if (filters.client) params.set('client', filters.client);
    if (filters.executor) params.set('executor', filters.executor);
    if (filters.status) params.set('status', filters.status);

    api.get(`/tickets?${params}`, { signal: controller.signal })
      .then(({ data }) => setTickets(data))
      .catch(() => {})
      .finally(() => setLoading(false));

    localStorage.setItem(FILTER_KEY, JSON.stringify(filters));
    localStorage.setItem(SORT_KEY, JSON.stringify(sort));

    return () => controller.abort();
  }, [filters, sort, month]);

  // Close calendar on outside click
  useEffect(() => {
    const handler = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setCalendarOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSort = (field) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc',
    }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSort({ field: 'date', order: 'desc' });
    setMonth(new Date());
  };

  const hasActiveFilters =
    Object.values(filters).some(Boolean) ||
    moment(month).format('MM-YYYY') !== moment().format('MM-YYYY');

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Zlecenia</h1>
        <Link href="/tickets/new" className="btn-success">
          <PlusIcon className="h-4 w-4" />
          Nowe zlecenie
        </Link>
      </div>

      <div className="card">
        {/* Search + filter toggle */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 max-w-md mx-auto mb-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9"
                placeholder="Szukaj po opisie, kliencie, NIP, wykonawcy..."
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              />
            </div>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`btn text-sm border px-3 py-1.5 rounded-xl gap-1 transition ${filterOpen ? 'bg-sky-50 border-sky-300 text-sky-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {filterOpen ? <ChevronDoubleUpIcon className="h-4 w-4" /> : <ChevronDoubleDownIcon className="h-4 w-4" />}
              Filtry
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-sky-500 ml-0.5" />}
            </button>
          </div>

          {/* Expandable filters */}
          <div className={`${filterOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'} transition-all duration-300`}>
            <div className="flex flex-wrap gap-3 justify-center pt-2 pb-1">
              {/* Month picker */}
              <div ref={calendarRef} className="relative">
                <button
                  onClick={() => setCalendarOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-700"
                >
                  <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                  {moment(month).format('MM/YYYY')}
                </button>
                {calendarOpen && (
                  <div className="absolute top-10 z-20 bg-white shadow-2xl rounded-xl border border-gray-100 p-2">
                    <DayPicker
                      month={month}
                      onMonthChange={(m) => { setMonth(m); setCalendarOpen(false); }}
                      showOutsideDays={false}
                      navLayout="around"
                      locale={pl}
                      animate
                    />
                  </div>
                )}
              </div>

              <select className="input w-auto px-3 py-1.5 rounded-xl" value={filters.client}
                onChange={(e) => setFilters((p) => ({ ...p, client: e.target.value }))}>
                <option value="">Wszyscy klienci</option>
                {clients.map((c) => <option key={c._id} value={c._id}>{c.code}</option>)}
              </select>

              <select className="input w-auto px-3 py-1.5 rounded-xl" value={filters.executor}
                onChange={(e) => setFilters((p) => ({ ...p, executor: e.target.value }))}>
                <option value="">Wszyscy wykonawcy</option>
                {employees.map((e) => <option key={e._id} value={e._id}>{e.name} {e.surname}</option>)}
              </select>

              <select className="input w-auto px-3 py-1.5 rounded-xl" value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                <option value="">Wszystkie statusy</option>
                <option value="waiting">Oczekujące</option>
                <option value="invoiced">Zafakturowane</option>
                <option value="sent">Wysłane</option>
              </select>

              <button onClick={resetFilters} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                <XMarkIcon className="h-4 w-4" /> Resetuj
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <SortableHeader field="status" sort={sort} onSort={handleSort} className="w-[90px] text-center">Status</SortableHeader>
                <SortableHeader field="date" sort={sort} onSort={handleSort} className="w-[110px] text-center">Data</SortableHeader>
                <SortableHeader field="client" sort={sort} onSort={handleSort} className="w-[130px]">Klient</SortableHeader>
                <SortableHeader field="description" sort={sort} onSort={handleSort}>Opis</SortableHeader>
                <SortableHeader field="executor" sort={sort} onSort={handleSort} className="hidden lg:table-cell w-[150px]">Wykonawca</SortableHeader>
                <th className="table-header w-[50px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-12 text-gray-400">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-12 text-gray-400">
                    Brak zleceń dla wybranych filtrów
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50 transition">
                    <td className="table-cell text-center">
                      <StatusBadge status={t.status} compact />
                    </td>
                    <td className="table-cell text-center text-gray-500 whitespace-nowrap text-xs">
                      {formatDateDisplay(t.date)}
                    </td>
                    <td className="table-cell font-medium text-gray-900 whitespace-nowrap">
                      {t.client?.code}
                    </td>
                    <td className="table-cell text-gray-600 max-w-0 truncate">
                      <div className="truncate">{t.description}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{formatDuration(t.duration)}</div>
                    </td>
                    <td className="hidden lg:table-cell table-cell text-gray-500 whitespace-nowrap">
                      {t.executor?.name} {t.executor?.surname}
                    </td>
                    <td className="table-cell">
                      <Link
                        href={`/tickets/${t._id}`}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition inline-flex"
                      >
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {tickets.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            Łącznie: {tickets.length} zleceń
          </div>
        )}
      </div>
    </Layout>
  );
}
