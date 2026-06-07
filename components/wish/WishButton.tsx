'use client';

import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { trackAction } from '@/lib/analytics';
import styles from './WishButton.module.css';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  border: '1px solid var(--color-gray-200, #e5e7eb)',
  borderRadius: 'var(--radius-md, 8px)',
  fontSize: 'var(--text-base, 1rem)',
  background: 'var(--color-white, #fff)',
  boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem',
  color: 'var(--color-gray-700, #374151)',
};

export function WishButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const reset = () => { setText(''); setEmail(''); setError(''); setDone(false); };
  const close = () => { setOpen(false); reset(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!text.trim()) { setError('Bitte einen Wunsch eingeben.'); return; }
    if (email.trim() && !email.includes('@')) { setError('Bitte eine gültige E-Mail angeben (oder leer lassen).'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/wuensche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), email: email.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Senden fehlgeschlagen.');
      }
      setDone(true);
      trackAction('wunsch-gesendet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Senden fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.wrap}>
        <button className={styles.btn} onClick={() => { setOpen(true); trackAction('open-wunsch'); }}>
          <span className={styles.sparkle}>✨</span> Gestalte mit
        </button>
      </div>

      {open && (
        <Modal onClose={close}>
          {done ? (
            <>
              <h2 style={{ marginTop: 0 }}>Danke für deinen Wunsch! ✨</h2>
              <p style={{ color: 'var(--color-gray-600, #4b5563)' }}>
                Deine Idee hilft uns, die Seite weiterzuentwickeln.{email.trim() ? ' Wir melden uns bei dir.' : ''}
              </p>
              <button onClick={close} style={{ padding: '0.55rem 1.1rem', background: 'var(--color-navy, #1e3a8a)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md, 8px)', cursor: 'pointer', fontWeight: 600 }}>
                Schließen
              </button>
            </>
          ) : (
            <>
              <h2 style={{ marginTop: 0, fontSize: 'var(--text-xl, 1.25rem)' }}>Gestalte mit ✨</h2>
              <p style={{ color: 'var(--color-gray-500, #6b7280)', fontSize: '0.88rem', marginTop: 0 }}>
                Wie könnte diese Seite besser oder schöner werden? Schreib uns deine Idee oder deinen Wunsch.
              </p>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '0.9rem' }}>
                  <label style={labelStyle}>Dein Wunsch / deine Idee *</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="z.B. eine Favoriten-Funktion, andere Farben, mehr Beispiele zu …"
                  />
                </div>
                <div style={{ marginBottom: '0.6rem' }}>
                  <label style={labelStyle}>E-Mail (freiwillig)</label>
                  <input
                    style={inputStyle}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Nur falls du eine Antwort möchtest"
                  />
                </div>

                {error && <div style={{ color: 'var(--color-error, #dc2626)', fontSize: '0.85rem', marginBottom: '0.8rem' }}>{error}</div>}

                <div style={{ display: 'flex', gap: '0.7rem' }}>
                  <button type="submit" disabled={submitting} style={{ padding: '0.6rem 1.25rem', background: 'var(--color-navy, #1e3a8a)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md, 8px)', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? 'Wird gesendet...' : 'Wunsch senden'}
                  </button>
                  <button type="button" onClick={close} style={{ padding: '0.6rem 1.25rem', background: 'var(--color-white, #fff)', border: '1px solid var(--color-gray-200, #e5e7eb)', borderRadius: 'var(--radius-md, 8px)', cursor: 'pointer' }}>
                    Abbrechen
                  </button>
                </div>
              </form>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
