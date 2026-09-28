'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackVisit } from '@/lib/analytics';

// Zählt jeden Seitenaufruf anonym mit dem Pfad der Seite. Rendert nichts.
export function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    trackVisit(pathname || '/');
  }, [pathname]);
  return null;
}
