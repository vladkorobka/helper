'use client';
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import Cropper from 'react-easy-crop';
import Layout from '../../../components/layout/Layout.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import api from '../../../lib/api.js';
import { getErrorMessage } from '../../../lib/utils.js';
import {
  UserCircleIcon,
  CameraIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Helper: get cropped canvas from crop area
async function getCroppedBlob(imageSrc, croppedAreaPixels) {
  const image = await createImageBitmap(await (await fetch(imageSrc)).blob());
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    200,
    200
  );
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  // Avatar crop state
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const onCropComplete = useCallback((_area, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setUploadingAvatar(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.webp');
      await api.post('/employees/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageSrc(null);
      await refreshUser();
      toast.success('Zdjęcie profilowe zaktualizowane');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        surname: form.surname,
        phone: form.phone,
      };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      await api.put('/employees/profile', payload);
      await refreshUser();
      toast.success('Profil zaktualizowany');
      setForm((p) => ({ ...p, currentPassword: '', newPassword: '' }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mój profil</h1>

        {/* Avatar Section */}
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Zdjęcie profilowe</h2>

          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100"
                />
              ) : (
                <UserCircleIcon className="w-20 h-20 text-gray-300" />
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition shadow"
                title="Zmień zdjęcie"
              >
                <CameraIcon className="h-3.5 w-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </div>

            <div className="text-sm text-gray-500">
              <p className="font-medium text-gray-800">{user?.name} {user?.surname}</p>
              <p className="mt-0.5 capitalize">{user?.role}</p>
              <p className="mt-1 text-xs">Kliknij ikonę aparatu, aby zmienić zdjęcie</p>
            </div>
          </div>

          {/* Crop modal */}
          {imageSrc && (
            <div className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Przytnij zdjęcie</h3>
                <div className="relative w-full h-64 bg-gray-900 rounded-xl overflow-hidden">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="mt-4">
                  <label className="text-xs text-gray-500">Zoom</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setImageSrc(null)}
                    className="btn-ghost"
                    disabled={uploadingAvatar}
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Anuluj
                  </button>
                  <button
                    onClick={handleAvatarUpload}
                    className="btn-primary"
                    disabled={uploadingAvatar}
                  >
                    <CheckIcon className="h-4 w-4" />
                    {uploadingAvatar ? 'Zapisuję...' : 'Zapisz zdjęcie'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile form */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Dane osobowe</h2>

          <form onSubmit={handleSave} className="space-y-4">
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

            <hr className="border-gray-100" />

            <h3 className="text-sm font-semibold text-gray-700">Zmiana hasła</h3>
            <p className="text-xs text-gray-400 -mt-2">Wypełnij tylko jeśli chcesz zmienić hasło</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aktualne hasło</label>
              <input
                className="input"
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nowe hasło <span className="text-xs text-gray-400">(min. 8, wielka litera, cyfra)</span>
              </label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPass ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  tabIndex={-1}
                >
                  {showPass ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                <CheckIcon className="h-4 w-4" />
                {saving ? 'Zapisuję...' : 'Zapisz zmiany'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
