'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import moment from 'moment';
import { toast } from 'sonner';
import Layout from '../../../components/layout/Layout.jsx';
import ConfirmDialog from '../../../components/shared/ConfirmDialog.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import api from '../../../lib/api.js';
import { getErrorMessage } from '../../../lib/utils.js';
import {
  CheckIcon,
  XMarkIcon,
  AtSymbolIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import CustomSelect from '../../../components/ui/CustomSelect.jsx';
import FormPageSkeleton from '../../../components/ui/FormPageSkeleton.jsx';
import GlassDatePicker from '../../../components/shared/GlassDatePicker.jsx';

const INITIAL = {
  date: moment().format('YYYY-MM-DD'),
  client: '',
  email: '',
  orderedBy: '',
  duration: 0,
  description: '',
  note: '',
  service_type: '',
  priceType: 0,
  category: '',
  commute: false,
  needsInvoice: false,
  reportSent: false,
  invoiced: false,
  executor: '',
};

const TICKET_SKELETON_ROWS = [
  { cols: 2 },
  { cols: 1 },
  { cols: 2 },
  { cols: 1, type: 'textarea' },
  { cols: 1, type: 'textarea-sm' },
  { cols: 1 },
  { cols: 3 },
];

export default function TicketFormPage() {
  const DEFAULT_PRICE = 250;
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const isEdit = !!id;

  const [form, setForm] = useState({ ...INITIAL, executor: user?._id || '' });
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState({
    priceTypes: [],
    serviceTypes: [],
    executionTypes: [],
  });

  // Client autocomplete
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdown, setClientDropdown] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);
  const clientRef = useRef(null);

  // orderedBy combobox
  const [orderedByInput, setOrderedByInput] = useState('');
  const [orderedByDropdown, setOrderedByDropdown] = useState(false);
  const orderedByRef = useRef(null);

  // Sync current user as default executor for new tickets
  // (user may arrive after component mounts due to async auth check)
  useEffect(() => {
    if (!isEdit && user?._id) {
      setForm((p) => ({ ...p, executor: p.executor || user._id }));
    }
  }, [user?._id, isEdit]);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load form data
  useEffect(() => {
    const load = async () => {
      try {
        const [clientsRes, settingsRes, employeesRes] =
          await Promise.allSettled([
            api.get('/clients/dropdown'),
            api.get('/settings'),
            api.get('/employees/executors'),
          ]);
        if (clientsRes.status === 'fulfilled')
          setClients(clientsRes.value.data);
        if (settingsRes.status === 'fulfilled')
          setSettings(settingsRes.value.data);
        if (employeesRes.status === 'fulfilled')
          setEmployees(employeesRes.value.data);

        if (isEdit) {
          const { data } = await api.get(`/tickets/${id}`);
          setForm({
            date: moment(data.date).format('YYYY-MM-DD'),
            client: data.client?._id || data.client || '',
            email: data.email || '',
            orderedBy: data.orderedBy || '',
            description: data.description || '',
            note: data.note || '',
            service_type: data.service_type || '',
            priceType: data.priceType || 0,
            category: data.category || '',
            commute: data.commute || false,
            needsInvoice: data.needsInvoice || false,
            reportSent: data.reportSent || false,
            invoiced: data.invoiced || false,
            executor: data.executor?._id || data.executor || user?._id || '',
          });
          if (data.duration) {
            setHours(Math.floor(data.duration / 60));
            setMinutes(data.duration % 60);
          }
          if (data.client?.name) setClientSearch(data.client.name);
          if (data.orderedBy) setOrderedByInput(data.orderedBy);
        } else {
          const sTypes = settingsRes.value?.data?.serviceTypes || [];
          const pTypes = settingsRes.value?.data?.priceTypes || [];
          const eTypes = settingsRes.value?.data?.executionTypes || [];
          setForm((p) => ({
            ...p,
            priceType: pTypes.includes(DEFAULT_PRICE)
              ? DEFAULT_PRICE
              : pTypes[0] || 0,
            service_type: sTypes.includes('Zlecenie')
              ? 'Zlecenie'
              : sTypes[0] || '',
            category: user?.preferredCategory || eTypes[0] || '',
          }));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Sync client search display after clients loaded
  useEffect(() => {
    if (form.client && clients.length && !clientSearch) {
      const c = clients.find((x) => x._id === form.client);
      if (c) setClientSearch(c.name);
    }
  }, [form.client, clients]);

  // Auto-fill email from client
  useEffect(() => {
    if (form.client && !isEdit) {
      const c = clients.find((x) => x._id === form.client);
      if (c) setForm((p) => ({ ...p, email: c.email || p.email }));
    }
  }, [form.client]);

  // Outside click handlers
  useEffect(() => {
    const h = (e) => {
      if (clientRef.current && !clientRef.current.contains(e.target))
        setClientDropdown(false);
      if (orderedByRef.current && !orderedByRef.current.contains(e.target))
        setOrderedByDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleClientSearch = (e) => {
    const q = e.target.value;
    setClientSearch(q);
    setClientDropdown(true);
    if (!q.trim()) {
      setFilteredClients(clients);
      return;
    }
    const lq = q.toLowerCase();
    setFilteredClients(
      clients.filter(
        (c) =>
          c.name?.toLowerCase().includes(lq) ||
          c.nip?.includes(lq) ||
          c.tags?.some((t) => t.toLowerCase().includes(lq)),
      ),
    );
  };

  const handleClientSelect = (client) => {
    setForm((p) => ({
      ...p,
      client: client._id,
      email: client.email || p.email,
      orderedBy: '',
    }));
    setClientSearch(client.name);
    setClientDropdown(false);
    setOrderedByInput('');
  };

  const handleSubmit = async (sendEmail = false) => {
    if (!form.client) {
      toast.error('Wybierz klienta');
      return;
    }
    if (!form.description) {
      toast.error('Opis jest wymagany');
      return;
    }
    if (!form.service_type) {
      toast.error('Wybierz rodzaj usługi');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        duration: parseInt(hours) * 60 + parseInt(minutes),
        reportSent: sendEmail ? true : form.reportSent,
      };

      if (isEdit) {
        await api.put(`/tickets/${id}`, payload);
      } else {
        await api.post('/tickets', payload);
      }
      toast.success(isEdit ? 'Zlecenie zaktualizowane' : 'Zlecenie utworzone');
      router.push('/tickets');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/tickets/${id}`);
      toast.success('Zlecenie usunięte');
      router.push('/tickets');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const selectedClient = clients.find((c) => c._id === form.client);

  const st = form.invoiced ? 'invoiced' : form.reportSent ? 'sent' : 'waiting';
  const label = {
    waiting: 'Klient oczekuje na raport',
    sent: 'Raport wysłany',
    invoiced: 'Zlecenie zafakturowane',
  }[st];

  const cls = {
    waiting: 'bg-amber-50 text-amber-700 border border-amber-200',
    sent: 'bg-sky-50 text-sky-700 border border-sky-200',
    invoiced: 'bg-teal-50 text-teal-700 border border-teal-200',
  }[st];

  if (loading)
    return (
      <Layout>
        <FormPageSkeleton rows={TICKET_SKELETON_ROWS} scrollable />
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="card">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h1 className="text-sm font-medium text-gray-600">
              {isEdit ? 'Edytuj zlecenie' : 'Nowe zlecenie'}
            </h1>
            {isEdit && (
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${cls}`}
              >
                {label}
              </span>
            )}
          </div>

          <div className="p-6 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data *
                </label>
                <GlassDatePicker
                  value={form.date}
                  onChange={(val) => setForm((p) => ({ ...p, date: val }))}
                />
              </div>

              {/* Executor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wykonawca
                </label>
                <CustomSelect
                  value={form.executor}
                  onChange={(val) => setForm((p) => ({ ...p, executor: val }))}
                  options={employees.map((e) => ({
                    value: e._id,
                    label: `${e.name} ${e.surname}`,
                  }))}
                  placeholder="Wybierz wykonawcę..."
                />
              </div>
            </div>

            {/* Client autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Klient *
              </label>
              <div ref={clientRef} className="relative">
                <input
                  className="input"
                  value={clientSearch}
                  onChange={handleClientSearch}
                  onFocus={() => {
                    setClientDropdown(true);
                    setFilteredClients(clients);
                  }}
                  placeholder="Szukaj po nazwie, NIP lub tagach..."
                />
                {clientDropdown && filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {filteredClients.map((c) => (
                      <div
                        key={c._id}
                        onClick={() => handleClientSelect(c)}
                        className="px-4 py-2.5 hover:bg-sky-50 cursor-pointer border-b border-gray-50 last:border-0"
                      >
                        <div className="font-medium text-sm text-gray-900">
                          {c.code}
                        </div>
                        <div className="text-xs text-gray-500">
                          {c.name} {c.nip && `· NIP: ${c.nip}`}
                        </div>
                        {c.tags?.length > 0 && (
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {c.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ordered by — combobox */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kto zlecił
                </label>
                <div ref={orderedByRef} className="relative">
                  <input
                    className="input"
                    value={orderedByInput}
                    onChange={(e) => {
                      setOrderedByInput(e.target.value);
                      setForm((p) => ({ ...p, orderedBy: e.target.value }));
                      if (form.client) setOrderedByDropdown(true);
                    }}
                    onFocus={() => {
                      if (form.client && selectedClient?.contactPerson?.length)
                        setOrderedByDropdown(true);
                    }}
                    placeholder="Wpisz lub wybierz..."
                    disabled={!form.client}
                  />
                  {orderedByDropdown &&
                    selectedClient?.contactPerson?.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                        {selectedClient.contactPerson
                          .filter(
                            (p) =>
                              !orderedByInput ||
                              p
                                .toLowerCase()
                                .includes(orderedByInput.toLowerCase()),
                          )
                          .map((p, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setOrderedByInput(p);
                                setForm((f) => ({ ...f, orderedBy: p }));
                                setOrderedByDropdown(false);
                              }}
                              className="px-4 py-2 hover:bg-sky-50 cursor-pointer text-sm text-gray-800 border-b border-gray-50 last:border-0"
                            >
                              {p}
                            </div>
                          ))}
                      </div>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="input resize-none"
                required
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uwagi
              </label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                rows={2}
                className="input resize-none"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Czas
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="input w-16 text-center"
                  />
                  <span className="text-sm text-gray-500">godz</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    step={5}
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="input w-16 text-center"
                  />
                  <span className="text-sm text-gray-500">min</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rodzaj usługi *
                </label>
                <CustomSelect
                  value={form.service_type}
                  onChange={(val) =>
                    setForm((p) => ({ ...p, service_type: val }))
                  }
                  options={[
                    ...settings.serviceTypes.map((t) => ({
                      value: t,
                      label: t,
                    })),
                  ]}
                  placeholder="Wybierz..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cena
                </label>
                <CustomSelect
                  value={form.priceType}
                  onChange={(val) => setForm((p) => ({ ...p, priceType: val }))}
                  options={[
                    ...settings.priceTypes.map((t) => ({
                      value: t,
                      label: `${t} zł/h`,
                    })),
                  ]}
                  placeholder="Wybierz cenę..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategoria *
                </label>
                <CustomSelect
                  value={form.category}
                  onChange={(val) => setForm((p) => ({ ...p, category: val }))}
                  options={[
                    ...settings.executionTypes.map((t) => ({
                      value: t,
                      label: t,
                    })),
                  ]}
                  placeholder="Wybierz kategorię..."
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="commute"
                  checked={form.commute}
                  onChange={handleChange}
                  className="w-4 h-4 text-sky-500 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Dojazd</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="needsInvoice"
                  checked={form.needsInvoice}
                  onChange={handleChange}
                  className="w-4 h-4 text-violet-500 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Wymaga faktury</span>
              </label>
              {/* invoiced is irreversible — read-only once true */}
              {form.needsInvoice && (
                <label
                  className={`flex items-center gap-2 ${form.invoiced ? 'opacity-70' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    name="invoiced"
                    checked={form.invoiced}
                    onChange={form.invoiced ? undefined : handleChange}
                    disabled={form.invoiced}
                    className="w-4 h-4 text-green-500 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">
                    Zafakturowane
                    {form.invoiced && (
                      <span className="ml-1 text-xs text-gray-400">
                        (nieodwracalne)
                      </span>
                    )}
                  </span>
                </label>
              )}
            </div>

            <div>
              <div>
                {isEdit && (
                  <button
                    onClick={() => setDeleteDialog(true)}
                    className="btn-danger text-sm"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Usuń
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/tickets')}
                className="btn-ghost"
              >
                <ArrowUturnLeftIcon className="h-4 w-4" />
                Anuluj
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={saving}
                className="btn bg-teal-500 text-white hover:bg-teal-600"
                title="Zapisz i wyślij email"
              >
                <AtSymbolIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={saving}
                className="btn-primary"
              >
                <CheckIcon className="h-4 w-4" />
                {saving ? 'Zapisuję...' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialog}
        title="Usuń zlecenie"
        message="Tej operacji nie można cofnąć."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(false)}
        loading={deleting}
      />
    </Layout>
  );
}
