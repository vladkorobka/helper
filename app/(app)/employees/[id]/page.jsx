'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import Layout from '../../../../components/layout/Layout.jsx';
import api from '../../../../lib/api.js';
import { getErrorMessage } from '../../../../lib/utils.js';
import { useAuth } from '../../../../context/AuthContext.jsx';
import { CheckIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

const PERM_LABEL = { tickets: 'Zlecenia', clients: 'Klienci', programs: 'Programy' };

export default function EmployeeFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isEdit = !!id;

  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      router.replace('/tickets');
    }
  }, [user, router]);

  const [form, setForm] = useState({
    name: '', surname: '', email: '', phone: '',
    permissions: ['tickets'], active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/employees/${id}`)
        .then(({ data }) => setForm({
          name: data.name || '',
          surname: data.surname || '',
          email: data.email || '',
          phone: data.phone || '',
          permissions: data.permissions || ['tickets'],
          active: data.active !== false,
        }))
        .catch((err) => toast.error(getErrorMessage(err)));
    }
  }, [id]);

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
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/employees/${id}`, form);
      } else {
        // New employees are created via invite — direct creation doesn't set password
        // But superadmin can create directly (password set via separate flow)
        await api.post('/employees', { ...form, login: form.email.split('@')[0] });
      }
      toast.success(isEdit ? 'Pracownik zaktualizowany' : 'Pracownik dodany');
      router.push('/employees');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edytuj pracownika' : 'Nowy pracownik'}
        </h1>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imię *</label>
              <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nazwisko</label>
              <input className="input" value={form.surname} onChange={(e) => setForm((p) => ({ ...p, surname: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input className="input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Uprawnienia</label>
            <div className="flex gap-4">
              {Object.entries(PERM_LABEL).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
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

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
              className="w-4 h-4 text-sky-500 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Konto aktywne</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => router.push('/employees')} className="btn-ghost">
              <ArrowUturnLeftIcon className="h-4 w-4" /> Anuluj
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              <CheckIcon className="h-4 w-4" /> {saving ? 'Zapisuję...' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
