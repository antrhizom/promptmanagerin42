'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { KiTool } from '@/lib/types';
import { useAuthContext } from '@/components/auth/AuthContext';
import { trackAction } from '@/lib/analytics';

export function useKiTools() {
  const { getIdToken } = useAuthContext();
  const [tools, setTools] = useState<KiTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/kitools');
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setTools(data.tools || []);
      setError(null);
      return true;
    } catch (err) {
      console.warn('[useKiTools] API failed:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await refresh();
      if (cancelled) return;
      loadedRef.current = ok;
      if (!ok) setError('Daten konnten nicht geladen werden. Bitte Seite neu laden.');
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [refresh]);

  // --- Admin (Token erforderlich) ---
  const addTool = useCallback(async (data: Omit<KiTool, 'id' | 'erstelltAm' | 'bewertungen'>) => {
    const token = await getIdToken();
    if (!token) throw new Error('Nicht als Admin angemeldet.');
    const res = await fetch('/api/kitools/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erstellen fehlgeschlagen');
    }
    await refresh();
  }, [getIdToken, refresh]);

  const updateTool = useCallback(async (id: string, data: Partial<KiTool>) => {
    const token = await getIdToken();
    if (!token) throw new Error('Nicht als Admin angemeldet.');
    const res = await fetch('/api/kitools/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ toolId: id, data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Update fehlgeschlagen');
    }
    await refresh();
  }, [getIdToken, refresh]);

  const deleteTool = useCallback(async (id: string) => {
    await updateTool(id, { deleted: true, deletedAt: new Date().toISOString() });
  }, [updateTool]);

  // --- Öffentlich: Liken (Emoji +1) ---
  const likeTool = useCallback(async (id: string, emoji: string) => {
    const tool = tools.find(t => t.id === id);
    if (!tool) return;
    const neue = { ...(tool.bewertungen || {}), [emoji]: ((tool.bewertungen || {})[emoji] || 0) + 1 };
    setTools(prev => prev.map(t => (t.id === id ? { ...t, bewertungen: neue } : t)));
    trackAction('like-kitool');
    try {
      await fetch('/api/kitools/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: id, emoji }),
      });
    } catch {
      // unkritisch
    }
  }, [tools]);

  return { tools, loading, error, refresh, addTool, updateTool, deleteTool, likeTool };
}
