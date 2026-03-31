'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Layout from '../../../../components/layout/Layout.jsx';
import api from '../../../../lib/api.js';
import { getErrorMessage } from '../../../../lib/utils.js';
import { useAuth } from '../../../../context/AuthContext.jsx';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const PERM_LABEL = {
  tickets: 'Zlecenia',
  clients: 'Klienci',
  programs: 'Programy',
};

const INITIAL_FORM = {
  name: '',
  surname: '',
  email: '',
  permissions: ['tickets'],
};

export default function AddEmployeePage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      router.replace('/tickets');
    }
  }, [user, router]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [sending, setSending] = useState(false);

  const togglePerm = (perm) => {
    setForm((p) => ({
      ...p,
      permissions: p.permissions.includes(perm)
        ? p.permissions.filter((x) => x !== perm)
        : [...p.permissions, perm],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.permissions.length) {
      toast.error('Wybierz co najmniej jedno uprawnienie');
      return;
    }
    setSending(true);
    try {
      await api.post('/auth/invite', {
        name: form.name,
        email: form.email,
        permissions: form.permissions,
      });
      toast.success(`Zaproszenie wysłane na ${form.email}`);
      router.push('/employees');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/employees')}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Dodaj pracownika</h1>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imię *
                </label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwisko
                </label>
                <input
                  className="input"
                  value={form.surname}
                  onChange={(e) => setForm((p) => ({ ...p, surname: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Na ten adres zostanie wysłane zaproszenie z linkiem aktywacyjnym.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uprawnienia
              </label>
              <div className="flex gap-5">
                {Object.entries(PERM_LABEL).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(key)}
                      onChange={() => togglePerm(key)}
                      className="w-4 h-4 text-sky-500 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.push('/employees')}
                className="btn-ghost"
              >
                Anuluj
              </button>
              <button type="submit" disabled={sending} className="btn-primary">
                {sending ? 'Wysyłam...' : 'Wyślij zaproszenie'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
