'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import Layout from '../../../components/layout/Layout.jsx';
import ConfirmDialog from '../../../components/shared/ConfirmDialog.jsx';
import api from '../../../lib/api.js';
import { getErrorMessage } from '../../../lib/utils.js';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = async (s = '') => {
    setLoading(true);
    try {
      const params = s ? `?search=${encodeURIComponent(s)}` : '';
      const { data } = await api.get(`/clients${params}`);
      setClients(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchClients(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/clients/${deleteId}`);
      toast.success('Klient usunięty');
      setClients((p) => p.filter((c) => c._id !== deleteId));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <Layout>
      <div className="card">
        <div className="flex justify-between">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-sm">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9"
                placeholder="Szukaj po nazwie, kodzie, NIP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mr-6">
            <Link href="/clients/new" className="btn-success">
              <PlusIcon className="h-4 w-4" />
              Nowy klient
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Kod</th>
                <th className="table-header">Nazwa</th>
                <th className="table-header hidden md:table-cell">NIP</th>
                <th className="table-header hidden lg:table-cell">Email</th>
                <th className="table-header hidden lg:table-cell">Tagi</th>
                <th className="table-header w-[80px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="table-cell text-center py-10 text-gray-400"
                  >
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="table-cell text-center py-10 text-gray-400"
                  >
                    Brak klientów
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition">
                    <td className="table-cell font-mono font-medium text-gray-900 text-sm">
                      {c.code}
                    </td>
                    <td className="table-cell font-medium text-gray-900">
                      {c.name}
                    </td>
                    <td className="table-cell hidden md:table-cell text-gray-500 text-sm">
                      {c.nip || '—'}
                    </td>
                    <td className="table-cell hidden lg:table-cell text-gray-500 text-sm">
                      {c.email}
                    </td>
                    <td className="table-cell hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.tags?.map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/clients/${c._id}`}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                        >
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(c._id)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Usuń klienta"
        message="Tej operacji nie można cofnąć. Powiązane zlecenia pozostaną w systemie."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </Layout>
  );
}
