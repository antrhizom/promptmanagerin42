'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuthContext } from '@/components/auth/AuthContext';

export default function AdminLoginPage() {
  const { loginAdmin, isAdmin, adminLoading } = useAuthContext();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (adminLoading) {
    return (
      <PageLayout>
        <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-gray-400)' }}>
          Laden...
        </div>
      </PageLayout>
    );
  }

  if (isAdmin) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await loginAdmin(email, password);
      router.push('/');
    } catch {
      setError('Ungultige Anmeldedaten. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div style={{
        maxWidth: '400px',
        margin: 'var(--space-16) auto',
      }}>
        <h1 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: '700',
          color: 'var(--color-gray-900)',
          marginBottom: 'var(--space-2)',
        }}>
          Admin-Bereich
        </h1>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-gray-500)',
          marginBottom: 'var(--space-8)',
        }}>
          Melde dich an, um Prompts zu erstellen und zu verwalten.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--text-sm)',
              fontWeight: '500',
              color: 'var(--color-gray-700)',
              marginBottom: 'var(--space-2)',
            }}>
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-base)',
                outline: 'none',
              }}
              placeholder="admin@example.com"
            />
          </div>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--text-sm)',
              fontWeight: '500',
              color: 'var(--color-gray-700)',
              marginBottom: 'var(--space-2)',
            }}>
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-base)',
                outline: 'none',
              }}
              placeholder="Passwort"
            />
          </div>

          {error && (
            <div style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-error-light)',
              color: 'var(--color-error)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-4)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-6)',
              backgroundColor: 'var(--color-navy)',
              color: 'var(--color-white)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.5 : 1,
              border: 'none',
            }}
          >
            {submitting ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>
      </div>
    </PageLayout>
  );
}
