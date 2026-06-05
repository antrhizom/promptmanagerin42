'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Prompt } from '@/lib/types';
import { useAuthContext } from '@/components/auth/AuthContext';
import { trackAction } from '@/lib/analytics';

export function usePrompts() {
  const { getIdToken } = useAuthContext();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  // Admin-Write via Server-API (mit Firebase-ID-Token als Bearer).
  const apiAdminUpdate = useCallback(async (promptId: string, data: Record<string, unknown>) => {
    const token = await getIdToken();
    if (!token) throw new Error('Nicht als Admin angemeldet.');
    const res = await fetch('/api/prompts/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ promptId, data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Update fehlgeschlagen: ${res.status}`);
    }
  }, [getIdToken]);

  const refreshPrompts = useCallback(async () => {
    try {
      const res = await fetch('/api/prompts');
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setPrompts(data.prompts || []);
      setError(null);
      return true;
    } catch (err) {
      console.warn('[usePrompts] API failed:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const ok = await refreshPrompts();
      if (cancelled) return;
      if (ok) {
        loadedRef.current = true;
        setLoading(false);
      } else {
        setError('Daten konnten nicht geladen werden. Bitte Seite neu laden.');
        setLoading(false);
      }
    }

    load();

    const interval = setInterval(() => {
      if (loadedRef.current) refreshPrompts();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refreshPrompts]);

  // --- Admin-Operationen (Token erforderlich) ---
  const addPrompt = useCallback(async (data: Omit<Prompt, 'id' | 'erstelltAm' | 'bewertungen' | 'nutzungsanzahl'>) => {
    const token = await getIdToken();
    if (!token) throw new Error('Nicht als Admin angemeldet.');
    const res = await fetch('/api/prompts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Prompt erstellen fehlgeschlagen');
    }
    await refreshPrompts();
  }, [getIdToken, refreshPrompts]);

  const updatePrompt = useCallback(async (id: string, data: Partial<Prompt>) => {
    await apiAdminUpdate(id, data as Record<string, unknown>);
    await refreshPrompts();
  }, [apiAdminUpdate, refreshPrompts]);

  const deletePrompt = useCallback(async (id: string) => {
    await apiAdminUpdate(id, {
      deleted: true,
      deletedAt: new Date().toISOString(),
    });
    await refreshPrompts();
  }, [apiAdminUpdate, refreshPrompts]);

  // --- Öffentliche Operation: Kopieren erhöht den Zähler (anonym, +1) ---
  const copyPrompt = useCallback(async (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    // Optimistisches UI-Update
    setPrompts(prev => prev.map(p =>
      p.id === promptId ? { ...p, nutzungsanzahl: (p.nutzungsanzahl || 0) + 1 } : p
    ));

    trackAction('copy');
    try {
      await fetch('/api/prompts/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId }),
      });
    } catch {
      // Zähler-Fehler ist unkritisch.
    }
  }, [prompts]);

  // --- Öffentliche Operation: Liken (Emoji-Bewertung +1, anonym) ---
  const ratePrompt = useCallback(async (promptId: string, emoji: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    const neueBewertungen = {
      ...(prompt.bewertungen || {}),
      [emoji]: ((prompt.bewertungen || {})[emoji] || 0) + 1,
    };
    // Optimistisches UI-Update
    setPrompts(prev => prev.map(p =>
      p.id === promptId ? { ...p, bewertungen: neueBewertungen } : p
    ));
    trackAction('like');
    try {
      await fetch('/api/prompts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, emoji }),
      });
    } catch {
      // Like-Fehler ist unkritisch.
    }
  }, [prompts]);

  // --- Kommentieren (nur mit Namens-Login; Identität wird mitgesendet) ---
  const addComment = useCallback(async (
    promptId: string,
    kommentar: { userCode: string; userName: string; text: string }
  ) => {
    if (!kommentar.userCode || !kommentar.userName) {
      throw new Error('Login erforderlich, um zu kommentieren.');
    }
    const res = await fetch('/api/prompts/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId, ...kommentar }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Kommentar fehlgeschlagen');
    }
    trackAction('comment');
    await refreshPrompts();
  }, [refreshPrompts]);

  return {
    prompts, loading, error, refreshPrompts,
    addPrompt, updatePrompt, deletePrompt,
    copyPrompt, ratePrompt, addComment,
  };
}
