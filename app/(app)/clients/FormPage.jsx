'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import Layout from '../../../components/layout/Layout.jsx';
import api from '../../../lib/api.js';
import { getErrorMessage } from '../../../lib/utils.js';
import { PlusIcon, XMarkIcon, CheckIcon, ArrowUturnLeftIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import CustomSelect from '../../../components/ui/CustomSelect.jsx';

const INITIAL = {
  code: '', nip: '', name: '', email: '', phone: '', address: '', notes: '',
  contactPerson: [''], tags: [], programs: [],
};

export default function ClientFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const isEdit = !!id;

  const [form, setForm] = useState(INITIAL);
  const [programs, setPrograms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [nipLoading, setNipLoading] = useState(false);

  useEffect(() => {
    api.get('/programs/dropdown').then(({ data }) => setPrograms(data));
    api.get('/employees/executors').then(({ data }) => setEmployees(data));
    if (isEdit) {
      api.get(`/clients/${id}`)
        .then(({ data }) => {
          setForm({
            code: data.code || '',
            nip: data.nip || '',
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            notes: data.notes || '',
            contactPerson: data.contactPerson?.length ? data.contactPerson : [''],
            tags: data.tags || [],
            programs: data.programs?.map((p) => ({
              program: p.program?._id || p.program || '',
              version: p.version || '',
              employee: p.employee || '',
              email: p.email || '',
            })) || [],
          });
        })
        .catch((err) => toast.error(getErrorMessage(err)))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleField = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleContact = (i, value) => {
    setForm((p) => {
      const arr = [...p.contactPerson];
      arr[i] = value;
      return { ...p, contactPerson: arr };
    });
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !form.tags.includes(t)) {
      setForm((p) => ({ ...p, tags: [...p.tags, t] }));
    }
    setTagInput('');
  };

  const addProgram = () => {
    setForm((p) => ({
      ...p,
      programs: [...p.programs, { program: '', version: '', employee: '', email: '' }],
    }));
  };

  const handleFetchNip = async () => {
    const nip = form.nip.replace(/\D/g, '');
    if (nip.length !== 10) {
      toast.error('NIP musi mieć dokładnie 10 cyfr');
      return;
    }
    setNipLoading(true);
    try {
      const { data } = await api.get(`/nip/${nip}`);
      setForm((p) => ({
        ...p,
        nip: data.nip || p.nip,
        name: data.nazwa || p.name,
        code: (data.nazwa || '').slice(0, 40),
        address: data.adres || p.address,
      }));
      toast.success('Dane pobrane z GUS');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setNipLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Filter out empty contacts
    const contactPerson = form.contactPerson.filter(Boolean);
    if (!contactPerson.length) { toast.error('Wymagana co najmniej jedna osoba kontaktowa'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        contactPerson,
        programs: form.programs.filter((p) => p.program),
      };
      if (isEdit) {
        await api.put(`/clients/${id}`, payload);
      } else {
        await api.post('/clients', payload);
      }
      toast.success(isEdit ? 'Klient zaktualizowany' : 'Klient dodany');
      router.push('/clients');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edytuj klienta' : 'Nowy klient'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Podstawowe dane</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={form.nip}
                    onChange={(e) => handleField('nip', e.target.value)}
                    placeholder="0000000000"
                    maxLength={13}
                  />
                  <button
                    type="button"
                    onClick={handleFetchNip}
                    disabled={nipLoading}
                    title="Pobierz dane z GUS (dataport.pl)"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition disabled:opacity-50 whitespace-nowrap"
                  >
                    {nipLoading ? (
                      <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <GlobeAltIcon className="h-4 w-4" />
                    )}
                    GUS
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Wpisz NIP i kliknij GUS, aby pobrać dane firmy.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kod *</label>
                <input className="input" value={form.code} onChange={(e) => handleField('code', e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa *</label>
              <input className="input" value={form.name} onChange={(e) => handleField('name', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" className="input" value={form.email} onChange={(e) => handleField('email', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input className="input" value={form.phone} onChange={(e) => handleField('phone', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
              <input className="input" value={form.address} onChange={(e) => handleField('address', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notatki</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={(e) => handleField('notes', e.target.value)} />
            </div>
          </div>

          {/* Contact persons */}
          <div className="card p-6 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Osoby kontaktowe</h2>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, contactPerson: [...p.contactPerson, ''] }))}
                className="btn-ghost text-xs"
              >
                <PlusIcon className="h-3.5 w-3.5" /> Dodaj
              </button>
            </div>
            {form.contactPerson.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input flex-1"
                  value={p}
                  onChange={(e) => handleContact(i, e.target.value)}
                  placeholder={`Osoba ${i + 1}`}
                />
                {form.contactPerson.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, contactPerson: prev.contactPerson.filter((_, j) => j !== i) }))}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tagi</h2>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Wpisz tag i naciśnij Enter"
              />
              <button type="button" onClick={addTag} className="btn-ghost">Dodaj</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full text-sm border border-sky-100">
                  #{tag}
                  <button type="button" onClick={() => setForm((p) => ({ ...p, tags: p.tags.filter((_, j) => j !== i) }))}>
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Programs */}
          <div className="card p-6 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Programy</h2>
              <button type="button" onClick={addProgram} className="btn-ghost text-xs">
                <PlusIcon className="h-3.5 w-3.5" /> Dodaj program
              </button>
            </div>
            {form.programs.map((prog, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 p-3 bg-gray-50/60 rounded-xl items-center">
                <CustomSelect
                  value={prog.program}
                  onChange={(val) => setForm((p) => {
                    const arr = [...p.programs];
                    arr[i] = { ...arr[i], program: val };
                    return { ...p, programs: arr };
                  })}
                  options={[{ value: '', label: 'Wybierz program' }, ...programs.map((p) => ({ value: p._id, label: `${p.code} — ${p.name}` }))]}
                  placeholder="Wybierz program"
                />
                <input
                  className="input"
                  placeholder="Wersja"
                  value={prog.version}
                  onChange={(e) => setForm((p) => {
                    const arr = [...p.programs]; arr[i] = { ...arr[i], version: e.target.value }; return { ...p, programs: arr };
                  })}
                />
                <CustomSelect
                  value={prog.employee}
                  onChange={(val) => setForm((p) => {
                    const arr = [...p.programs];
                    arr[i] = { ...arr[i], employee: val };
                    return { ...p, programs: arr };
                  })}
                  options={[{ value: '', label: '— Opiekun —' }, ...employees.map((emp) => ({ value: `${emp.name} ${emp.surname}`.trim(), label: `${emp.name} ${emp.surname}` }))]}
                  placeholder="— Opiekun —"
                />
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    type="email"
                    placeholder="Email"
                    value={prog.email}
                    onChange={(e) => setForm((p) => {
                      const arr = [...p.programs]; arr[i] = { ...arr[i], email: e.target.value }; return { ...p, programs: arr };
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, programs: p.programs.filter((_, j) => j !== i) }))}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {form.programs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Brak przypisanych programów</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => router.push('/clients')} className="btn-ghost">
              <ArrowUturnLeftIcon className="h-4 w-4" /> Anuluj
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              <CheckIcon className="h-4 w-4" />
              {saving ? 'Zapisuję...' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
