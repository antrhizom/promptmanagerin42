'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, onSnapshot, getDocs,
  addDoc, updateDoc, doc, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Prompt } from '@/lib/types';
import { MAKE_WEBHOOK_URL } from '@/lib/constants';

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    const promptsRef = collection(db, 'prompts');
    const q = query(promptsRef, orderBy('erstelltAm', 'desc'));

    // Strategy 1: Erst getDocs (einfacher HTTP GET - funktioniert immer)
    async function loadInitial() {
      try {
        console.log('[usePrompts] Loading via getDocs...');
        const snapshot = await getDocs(q);
        if (cancelled) return;

        console.log('[usePrompts] getDocs SUCCESS:', snapshot.size, 'documents');
        const promptsData = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Prompt[];

        setPrompts(promptsData.filter(p => !p.deleted));
        setLoading(false);
        setError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        const fireErr = err as { code?: string; message?: string };
        console.error('[usePrompts] getDocs ERROR:', fireErr.code, fireErr.message);
        setError(`Fehler: ${fireErr.code || 'unbekannt'} - ${fireErr.message || 'Verbindung fehlgeschlagen'}`);
        setLoading(false);
      }
    }

    // Strategy 2: Dann onSnapshot für Live-Updates (WebSocket)
    function startLiveUpdates() {
      try {
        unsubscribe = onSnapshot(q, (snapshot) => {
          if (cancelled) return;
          console.log('[usePrompts] onSnapshot update:', snapshot.size, 'documents');
          const promptsData = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          })) as Prompt[];

          setPrompts(promptsData.filter(p => !p.deleted));
          setLoading(false);
          setError(null);
        }, (err) => {
          // onSnapshot-Fehler ist nicht kritisch wenn getDocs funktioniert hat
          console.warn('[usePrompts] onSnapshot error (non-critical):', err.code);
        });
      } catch {
        console.warn('[usePrompts] onSnapshot setup failed (non-critical)');
      }
    }

    // Beide starten
    loadInitial().then(() => {
      if (!cancelled) startLiveUpdates();
    });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const addPrompt = useCallback(async (data: Omit<Prompt, 'id' | 'erstelltAm' | 'bewertungen' | 'nutzungsanzahl'>) => {
    await addDoc(collection(db, 'prompts'), {
      ...data,
      bewertungen: { '👍': 0, '❤️': 0, '🔥': 0, '⭐': 0, '💡': 0 },
      nutzungsanzahl: 0,
      erstelltAm: serverTimestamp(),
    });
  }, []);

  const updatePrompt = useCallback(async (id: string, data: Partial<Prompt>) => {
    await updateDoc(doc(db, 'prompts', id), data);
  }, []);

  const deletePrompt = useCallback(async (id: string, userCode: string) => {
    await updateDoc(doc(db, 'prompts', id), {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userCode
    });
  }, []);

  const ratePrompt = useCallback(async (promptId: string, emoji: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    const neueBewertungen = {
      ...(prompt.bewertungen || {}),
      [emoji]: ((prompt.bewertungen || {})[emoji] || 0) + 1
    };

    await updateDoc(doc(db, 'prompts', promptId), {
      bewertungen: neueBewertungen
    });
  }, [prompts]);

  const copyPrompt = useCallback(async (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    await updateDoc(doc(db, 'prompts', promptId), {
      nutzungsanzahl: (prompt.nutzungsanzahl || 0) + 1
    });
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
      timestamp: Timestamp.now()
    };

    const aktualisierteKommentare = [...(prompt.kommentare || []), neuerKommentar];

    await updateDoc(doc(db, 'prompts', promptId), {
      kommentare: aktualisierteKommentare
    });
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

    await updateDoc(doc(db, 'prompts', promptId), {
      deletionRequests: updatedRequests
    });

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
  }, [prompts]);

  return {
    prompts, loading, error,
    addPrompt, updatePrompt, deletePrompt,
    ratePrompt, copyPrompt, addComment, requestDeletion
  };
}
