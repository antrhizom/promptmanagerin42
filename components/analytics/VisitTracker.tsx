'use client';

import { useEffect } from 'react';
import { trackVisit } from '@/lib/analytics';

// Zählt einmal pro Session einen anonymen Besuch. Rendert nichts.
export function VisitTracker() {
  useEffect(() => {
    trackVisit();
  }, []);
  return null;
}
