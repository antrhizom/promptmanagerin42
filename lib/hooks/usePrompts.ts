'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Prompt } from '@/lib/types';
import { MAKE_WEBHOOK_URL } from '@/lib/constants';

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(collection(db, 'prompts'), orderBy('erstelltAm', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const promptsData = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Prompt[];

        setPrompts(promptsData.filter(p => !p.deleted));
        setLoading(false);
      }, (error) => {
        console.error('Firebase Fehler:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Firebase Setup Fehler:', error);
      setLoading(false);
    }
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
    prompts, loading,
    addPrompt, updatePrompt, deletePrompt,
    ratePrompt, copyPrompt, addComment, requestDeletion
  };
}
