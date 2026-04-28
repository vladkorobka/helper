'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Layout from '../../../components/layout/Layout.jsx';
import ConfirmDialog from '../../../components/shared/ConfirmDialog.jsx';
import api from '../../../lib/api.js';
import { getErrorMessage } from '../../../lib/utils.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import {
  PlusIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  UserCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const PERM_LABEL = {
  tickets: 'Zlecenia',
  clients: 'Klienci',
  programs: 'Programy',
};

export default function EmployeesPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      router.replace('/tickets');
    }
  }, [user, router]);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Pending invites
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(true);

  // Resend dialog state
  const [resendDialog, setResendDialog] = useState({
    open: false,
    invite: null,
    email: '',
  });
  const [resending, setResending] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/employees');
      setEmployees(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    setInvitesLoading(true);
    try {
      const { data } = await api.get('/auth/invites');
      setInvites(data);
    } catch (err) {
      // silently ignore — non-critical
    } finally {
      setInvitesLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchInvites();
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/employees/${deleteId}`);
      toast.success('Pracownik usunięty');
      setEmployees((p) => p.filter((e) => e._id !== deleteId));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const openResend = (invite) => {
    setResendDialog({ open: true, invite, email: invite.email });
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setResending(true);
    try {
      await api.post('/auth/resend-invite', {
        inviteId: resendDialog.invite._id,
        email: resendDialog.email,
      });
      toast.success(`Zaproszenie wysłane ponownie na ${resendDialog.email}`);
      setResendDialog({ open: false, invite: null, email: '' });
      fetchInvites();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <Layout>
      {/* Employees table */}
      <div className="card mb-6">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Pracownicy</h2>
          <Link href="/employees/new" className="btn-success">
            <PlusIcon className="h-4 w-4" /> Dodaj pracownika
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header w-[50px]" />
                <th className="table-header">Imię i nazwisko</th>
                <th className="table-header hidden md:table-cell">Login</th>
                <th className="table-header hidden lg:table-cell">
                  Uprawnienia
                </th>
                <th className="table-header hidden lg:table-cell">Status</th>
                <th className="table-header w-[80px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-10">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="table-cell text-center py-10 text-gray-400"
                  >
                    Brak pracowników
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-gray-50 transition">
                    <td className="table-cell ">
                      {emp.avatar ? (
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="max-w-none w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="w-8 h-8 text-gray-300" />
                      )}
                    </td>
                    <td className="table-cell font-medium text-gray-900">
                      {emp.name} {emp.surname}
                    </td>
                    <td className="table-cell hidden md:table-cell text-gray-500 font-mono text-sm">
                      {emp.login}
                    </td>
                    <td className="table-cell hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {emp.permissions.map((p) => (
                          <span
                            key={p}
                            className="text-xs bg-sky-50 text-sky-700 rounded-full px-2 py-0.5"
                          >
                            {PERM_LABEL[p]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell hidden lg:table-cell">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          emp.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {emp.active ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/employees/${emp._id}`}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                          title="Edytuj"
                        >
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(emp._id)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                          title="Usuń"
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

      {/* Pending invites */}
      {!invitesLoading && invites.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <ClockIcon className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-700">
              Oczekujące zaproszenia
            </h2>
            <span className="ml-auto text-xs text-gray-400">
              {invites.length}{' '}
              {invites.length === 1 ? 'zaproszenie' : 'zaproszeń'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Imię</th>
                  <th className="table-header">Email</th>
                  <th className="table-header hidden md:table-cell">
                    Uprawnienia
                  </th>
                  <th className="table-header hidden lg:table-cell">Wygasa</th>
                  <th className="table-header w-[120px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invites.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50 transition">
                    <td className="table-cell font-medium text-gray-900">
                      {inv.name}
                    </td>
                    <td className="table-cell text-gray-500 text-sm">
                      {inv.email}
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {inv.permissions.map((p) => (
                          <span
                            key={p}
                            className="text-xs bg-amber-50 text-amber-700 rounded-full px-2 py-0.5"
                          >
                            {PERM_LABEL[p]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell hidden lg:table-cell text-xs text-gray-400">
                      {new Date(inv.expiresAt).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => openResend(inv)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition font-medium"
                        title="Wyślij ponownie"
                      >
                        <ArrowPathIcon className="h-3.5 w-3.5" />
                        Wyślij ponownie
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resend invite dialog */}
      {resendDialog.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-gray-900">
                Wyślij zaproszenie ponownie
              </h2>
              <button
                onClick={() =>
                  setResendDialog({ open: false, invite: null, email: '' })
                }
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Możesz zmienić adres email przed ponownym wysłaniem.
            </p>

            <form onSubmit={handleResend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imię
                </label>
                <input
                  className="input bg-gray-50"
                  value={resendDialog.invite?.name ?? ''}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  className="input"
                  value={resendDialog.email}
                  onChange={(e) =>
                    setResendDialog((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() =>
                    setResendDialog({ open: false, invite: null, email: '' })
                  }
                  className="btn-ghost"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={resending}
                  className="btn-primary"
                >
                  {resending ? 'Wysyłam...' : 'Wyślij'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Usuń pracownika"
        message="Tej operacji nie można cofnąć."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </Layout>
  );
}
