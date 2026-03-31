'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Layout from '../../../components/layout/Layout.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import api from '../../../lib/api.js';
import { getErrorMessage } from '../../../lib/utils.js';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

function TypeSection({ title, field, items, onAdd, onRemove }) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const val = input.trim();
    if (!val) return;
    onAdd(field, field === 'priceTypes' ? Number(val) : val);
    setInput('');
  };

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{title}</h2>
      <div className="flex gap-2 mb-3">
        <input
          className="input flex-1"
          value={input}
          type={field === 'priceTypes' ? 'number' : 'text'}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          placeholder={field === 'priceTypes' ? 'Nowa stawka (zł/h)' : 'Nowa wartość'}
        />
        <button onClick={handleAdd} className="btn-ghost">
          <PlusIcon className="h-4 w-4" /> Dodaj
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700"
          >
            {field === 'priceTypes' ? `${item} zł/h` : item}
            <button
              onClick={() => onRemove(field, item)}
              className="text-gray-400 hover:text-red-500 transition"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({ priceTypes: [], serviceTypes: [], executionTypes: [], programTypes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      router.replace('/tickets');
    }
  }, [user, router]);

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => setSettings(data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (field, value) => {
    try {
      const { data } = await api.post('/settings/add-type', { field, value });
      setSettings(data);
      toast.success('Dodano');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRemove = async (field, value) => {
    try {
      const { data } = await api.delete('/settings/remove-type', { data: { field, value } });
      setSettings(data);
      toast.success('Usunięto');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ustawienia</h1>

      <div className="space-y-4 max-w-2xl">
        <TypeSection
          title="Stawki cenowe"
          field="priceTypes"
          items={settings.priceTypes}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
        <TypeSection
          title="Rodzaje usług"
          field="serviceTypes"
          items={settings.serviceTypes}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
        <TypeSection
          title="Kategorie wykonania"
          field="executionTypes"
          items={settings.executionTypes}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
        <TypeSection
          title="Kategorie programów"
          field="programTypes"
          items={settings.programTypes}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      </div>
    </Layout>
  );
}
