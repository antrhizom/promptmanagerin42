'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/components/auth/AuthContext';

interface Wunsch {
  id: string;
  text: string;
  email?: string;
  createdAt?: string;
}

export function WuenscheReview() {
  const { getIdToken } = useAuthContext();
  const [wuensche, setWuensche] = useState<Wunsch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = await getIdToken();
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch('/api/wuensche', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setWuensche((await res.json()).wuensche || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => { load(); }, [load]);

  const fmt = (s?: string) => {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const box: React.CSSProperties = {
    background: 'var(--color-white,#fff)', border: '1px solid var(--color-gray-200,#e5e7eb)',
    borderRadius: 'var(--radius-lg,12px)', padding: '1rem 1.25rem', marginBottom: '1.5rem',
  };

  if (loading) return null;

  return (
    <div style={box}>
      <h2 style={{ marginTop: 0, fontSize: 'var(--text-lg,1.125rem)' }}>
        Wünsche „Gestalte mit" {wuensche.length > 0 && (
          <span style={{ background: 'var(--color-primary-blue,#0050b3)', color: '#fff', borderRadius: '999px', padding: '0.1rem 0.55rem', fontSize: '0.8rem', marginLeft: '0.4rem' }}>{wuensche.length}</span>
        )}
      </h2>
      {wuensche.length === 0 ? (
        <p style={{ color: 'var(--color-gray-500,#6b7280)', margin: 0 }}>Noch keine Wünsche eingegangen.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          {wuensche.map(w => (
            <div key={w.id} style={{ border: '1px solid var(--color-gray-100,#f3f4f6)', borderRadius: 'var(--radius-md,8px)', padding: '0.7rem 0.9rem' }}>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--color-gray-800,#1f2937)', fontSize: '0.92rem' }}>{w.text}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500,#6b7280)', marginTop: '0.4rem' }}>
                {fmt(w.createdAt)}{w.email ? ` · ${w.email}` : ' · keine E-Mail'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
