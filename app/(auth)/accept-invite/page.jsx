'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import api from '../../../lib/api.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { getErrorMessage } from '../../../lib/utils.js';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const token = searchParams.get('token');

  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: '',
    surname: '',
    phone: '',
    password: '',
    token: token || '',
  });

  useEffect(() => {
    if (!token) {
      setError('Brak tokenu zaproszenia');
      setLoading(false);
      return;
    }
    api
      .get(`/auth/invite/${token}`)
      .then(({ data }) => {
        setInfo(data);
        setForm((p) => ({ ...p, name: data.name }));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/accept-invite', form);
      await refreshUser();
      toast.success('Konto aktywowane! Witamy w systemie.');
      router.push('/tickets');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow p-8 max-w-sm text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-sm text-gray-500 mt-2">Skontaktuj się z administratorem.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Aktywacja konta</h1>
        <p className="text-sm text-gray-500 mt-1">
          Zaproszony/a: <strong>{info?.email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imię *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nazwisko</label>
            <input
              className="input"
              value={form.surname}
              onChange={(e) => setForm((p) => ({ ...p, surname: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
          <input
            className="input"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+48 000 000 000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hasło * <span className="text-xs text-gray-400">(min. 8 znaków, wielka litera, cyfra)</span>
          </label>
          <div className="relative">
            <input
              className="input pr-10"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPass ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full btn-primary justify-center py-2.5 text-base"
        >
          {submitting ? 'Aktywuję...' : 'Aktywuj konto'}
        </button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />}>
      <AcceptInviteContent />
    </Suspense>
  );
}
