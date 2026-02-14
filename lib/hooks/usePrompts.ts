'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Prompt } from '@/lib/types';
import { MAKE_WEBHOOK_URL } from '@/lib/constants';

// Helper: Update via Server-API
async function apiUpdate(promptId: string, data: Record<string, unknown>) {
  const res = await fetch('/api/prompts/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptId, data })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update failed: ${res.status}`);
  }
}

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  // Lade-Funktion via Server-API Route
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

    // Auto-Refresh alle 30 Sekunden für Updates
    const interval = setInterval(() => {
      if (loadedRef.current) refreshPrompts();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refreshPrompts]);

  const addPrompt = useCallback(async (data: Omit<Prompt, 'id' | 'erstelltAm' | 'bewertungen' | 'nutzungsanzahl'>) => {
    const res = await fetch('/api/prompts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Prompt erstellen fehlgeschlagen');
    await refreshPrompts();
  }, [refreshPrompts]);

  const updatePrompt = useCallback(async (id: string, data: Partial<Prompt>) => {
    await apiUpdate(id, data as Record<string, unknown>);
    await refreshPrompts();
  }, [refreshPrompts]);

  const deletePrompt = useCallback(async (id: string, userCode: string) => {
    await apiUpdate(id, {
      deleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: userCode
    });
    await refreshPrompts();
  }, [refreshPrompts]);

  const ratePrompt = useCallback(async (promptId: string, emoji: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    const neueBewertungen = {
      ...(prompt.bewertungen || {}),
      [emoji]: ((prompt.bewertungen || {})[emoji] || 0) + 1
    };

    // Optimistic update
    setPrompts(prev => prev.map(p =>
      p.id === promptId ? { ...p, bewertungen: neueBewertungen } : p
    ));

    await apiUpdate(promptId, { bewertungen: neueBewertungen });
  }, [prompts]);

  const copyPrompt = useCallback(async (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    const neueAnzahl = (prompt.nutzungsanzahl || 0) + 1;

    // Optimistic update
    setPrompts(prev => prev.map(p =>
      p.id === promptId ? { ...p, nutzungsanzahl: neueAnzahl } : p
    ));

    await apiUpdate(promptId, { nutzungsanzahl: neueAnzahl });
  }, [prompts]);

  const addComment = useCallback(async (
    promptId: string,
    kommentar: { userCode: string; userName: string; text: string }
  ) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    const neuerKommentar = {
      id: Date.now().toString(),
      userCode: kommentar.userCode,
      userName: kommentar.userName,
      text: kommentar.text.trim(),
      timestamp: new Date().toISOString()
    };

    const aktualisierteKommentare = [...(prompt.kommentare || []), neuerKommentar];

    // Optimistic update
    setPrompts(prev => prev.map(p =>
      p.id === promptId ? { ...p, kommentare: aktualisierteKommentare } : p
    ));

    await apiUpdate(promptId, { kommentare: aktualisierteKommentare });
  }, [prompts]);

  const requestDeletion = useCallback(async (
    promptId: string,
    request: { userCode: string; userName: string; grund: string }
  ) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    const deletionRequests = prompt.deletionRequests || [];
    const updatedRequests = [
      ...deletionRequests,
      {
        userCode: request.userCode,
        userName: request.userName,
        grund: request.grund.trim(),
        timestamp: new Date().toISOString()
      }
    ];

    await apiUpdate(promptId, { deletionRequests: updatedRequests });
    await refreshPrompts();

    // Notify via Make.com webhook
    try {
      await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'deletion_request',
          promptId,
          promptTitle: prompt.titel,
          requester: request.userName,
          reason: request.grund
        })
      });
    } catch {
      // Webhook failure is not critical
    }
  }, [prompts, refreshPrompts]);

  return {
    prompts, loading, error, refreshPrompts,
    addPrompt, updatePrompt, deletePrompt,
    ratePrompt, copyPrompt, addComment, requestDeletion
  };
}
