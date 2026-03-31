'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import Layout from '../../../components/layout/Layout.jsx';
import api from '../../../lib/api.js';
import { getErrorMessage } from '../../../lib/utils.js';
import { PlusIcon, XMarkIcon, CheckIcon, ArrowUturnLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function ProgramFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const isEdit = !!id;

  const [form, setForm] = useState({ code: '', name: '', notes: '', categories: [] });
  const [programTypes, setProgramTypes] = useState([]);
  const [newTypeInput, setNewTypeInput] = useState('');
  const [addingNewType, setAddingNewType] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Load available program types from settings
    api.get('/settings').then(({ data }) => setProgramTypes(data.programTypes || []));

    if (isEdit) {
      api.get(`/programs/${id}`)
        .then(({ data }) => setForm({
          code: data.code,
          name: data.name,
          notes: data.notes || '',
          categories: data.categories || [],
        }))
        .catch((err) => toast.error(getErrorMessage(err)));
    }
  }, [id]);

  const toggleCategory = (cat) => {
    setForm((p) => ({
      ...p,
      categories: p.categories.includes(cat)
        ? p.categories.filter((c) => c !== cat)
        : [...p.categories, cat],
    }));
  };

  // Add brand new category to settings and select it
  const handleAddNewType = async () => {
    const val = newTypeInput.trim();
    if (!val) return;
    try {
      const { data } = await api.post('/settings/add-type', { field: 'programTypes', value: val });
      setProgramTypes(data.programTypes);
      // Auto-select the newly added type
      setForm((p) => ({
        ...p,
        categories: p.categories.includes(val) ? p.categories : [...p.categories, val],
      }));
      setNewTypeInput('');
      setAddingNewType(false);
      toast.success(`Dodano kategorię: ${val}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleZestawienie = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/programs/${id}/zestawienie`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Błąd pobierania zestawienia');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zestawienie-${form.code || id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categories.length) {
      toast.error('Wybierz co najmniej jedną kategorię');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/programs/${id}`, form);
      } else {
        await api.post('/programs', form);
      }
      toast.success(isEdit ? 'Program zaktualizowany' : 'Program dodany');
      router.push('/programs');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edytuj program' : 'Nowy program'}
          </h1>
          {isEdit && (
            <button
              type="button"
              onClick={handleZestawienie}
              disabled={downloading}
              className="btn bg-teal-500 text-white hover:bg-teal-600"
              title="Pobierz zestawienie klientów z tym programem"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {downloading ? 'Pobieranie...' : 'Zestawienie'}
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kod *</label>
              <input
                className="input"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notatki</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>

          {/* Categories — checkboxes from settings */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Kategorie * <span className="text-xs text-gray-400">(z ustawień)</span>
              </label>
              <button
                type="button"
                onClick={() => setAddingNewType((v) => !v)}
                className="text-xs text-sky-600 hover:underline flex items-center gap-0.5"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Nowa kategoria
              </button>
            </div>

            {/* Inline: add new category to settings */}
            {addingNewType && (
              <div className="flex gap-2 mb-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
                <input
                  className="input flex-1 text-sm"
                  placeholder="Nazwa nowej kategorii..."
                  value={newTypeInput}
                  onChange={(e) => setNewTypeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewType(); } }}
                  autoFocus
                />
                <button type="button" onClick={handleAddNewType} className="btn-primary text-sm">
                  Dodaj
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingNewType(false); setNewTypeInput(''); }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {programTypes.length === 0 ? (
                <p className="text-sm text-gray-400">Brak kategorii — dodaj je w Ustawieniach.</p>
              ) : (
                programTypes.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      form.categories.includes(cat)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))
              )}
            </div>

            {form.categories.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Wybrane: {form.categories.join(', ')}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => router.push('/programs')} className="btn-ghost">
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
