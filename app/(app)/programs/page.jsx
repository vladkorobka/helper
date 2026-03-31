'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import Layout from '../../../components/layout/Layout.jsx';
import ConfirmDialog from '../../../components/shared/ConfirmDialog.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import api from '../../../lib/api.js';
import { getErrorMessage } from '../../../lib/utils.js';
import { PlusIcon, EllipsisHorizontalIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function ProgramsPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const canEdit = user?.role === 'superadmin' || user?.permissions?.includes('programs');
  const canDelete = user?.role === 'superadmin';

  useEffect(() => {
    api.get('/programs')
      .then(({ data }) => setPrograms(data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/programs/${deleteId}`);
      toast.success('Program usunięty');
      setPrograms((p) => p.filter((x) => x._id !== deleteId));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Programy</h1>
        {canEdit && (
          <Link href="/programs/new" className="btn-success">
            <PlusIcon className="h-4 w-4" /> Nowy program
          </Link>
        )}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header w-[100px]">Kod</th>
                <th className="table-header">Nazwa</th>
                <th className="table-header hidden md:table-cell">Kategorie</th>
                <th className="table-header hidden lg:table-cell">Notatki</th>
                {canEdit && <th className="table-header w-[80px]" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="table-cell text-center py-10 text-gray-400">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /></div>
                </td></tr>
              ) : programs.length === 0 ? (
                <tr><td colSpan={5} className="table-cell text-center py-10 text-gray-400">Brak programów</td></tr>
              ) : (
                programs.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition">
                    <td className="table-cell font-mono font-medium text-gray-900 text-sm">{p.code}</td>
                    <td className="table-cell font-medium text-gray-900">{p.name}</td>
                    <td className="table-cell hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.categories?.map((c, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 rounded px-2 py-0.5">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell hidden lg:table-cell text-gray-500 text-sm truncate max-w-xs">{p.notes || '—'}</td>
                    {canEdit && (
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <Link href={`/programs/${p._id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                            <EllipsisHorizontalIcon className="h-5 w-5" />
                          </Link>
                          {canDelete && (
                            <button onClick={() => setDeleteId(p._id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Usuń program"
        message="Tej operacji nie można cofnąć."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </Layout>
  );
}
