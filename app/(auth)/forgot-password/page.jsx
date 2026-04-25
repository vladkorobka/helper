'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '../../../lib/api.js';
import { getErrorMessage } from '../../../lib/utils.js';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-auth-card p-8 w-full max-w-sm">
      {sent ? (
        <div className="text-center">
          <CheckCircleIcon className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Email wysłany</h2>
          <p className="text-sm text-gray-500 mt-2">
            Jeśli konto z tym adresem istnieje, wysłaliśmy link do resetowania hasła.
          </p>
          <Link href="/login" className="block mt-6 text-sky-600 hover:underline text-sm">
            Powrót do logowania
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Resetuj hasło</h1>
            <p className="text-sm text-gray-500 mt-1">Podaj adres email swojego konta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="input"
                placeholder="twoj@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5"
            >
              {loading ? 'Wysyłam...' : 'Wyślij link resetujący'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link href="/login" className="text-sky-600 hover:underline">
              Powrót do logowania
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
