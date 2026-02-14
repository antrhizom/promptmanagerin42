'use client';

import { useState, useEffect, useMemo } from 'react';
import { Prompt, FilterState, SortOption } from '@/lib/types';
import { ANWENDUNGSFAELLE } from '@/lib/constants';

const DEFAULT_FILTERS: FilterState = {
  suchbegriff: '',
  filterPlattform: '',
  filterOutputFormat: '',
  filterAnwendungsfall: '',
  filterTag: '',
  filterRolle: '',
  filterBildungsstufe: '',
  sortierung: 'aktuell'
};

export function useFilters(prompts: Prompt[]) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Read URL params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const updates: Partial<FilterState> = {};

    const rolleParam = params.get('rolle');
    const plattformParam = params.get('plattform');
    const formatParam = params.get('format');
    const anwendungsfallParam = params.get('anwendungsfall');
    const sucheParam = params.get('suche');

    if (rolleParam) updates.filterRolle = decodeURIComponent(rolleParam);
    if (plattformParam) updates.filterPlattform = decodeURIComponent(plattformParam);
    if (formatParam) updates.filterOutputFormat = decodeURIComponent(formatParam);
    if (anwendungsfallParam) updates.filterAnwendungsfall = decodeURIComponent(anwendungsfallParam);
    if (sucheParam) updates.suchbegriff = decodeURIComponent(sucheParam);

    if (Object.keys(updates).length > 0) {
      setFilters(prev => ({ ...prev, ...updates }));
      setTimeout(() => {
        document.getElementById('prompts-liste')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      // Search
      let suchMatch = true;
      if (filters.suchbegriff.startsWith('#')) {
        const tagSuche = filters.suchbegriff.slice(1).toLowerCase();
        suchMatch = (prompt.tags || []).some(tag => tag.toLowerCase().includes(tagSuche));
      } else if (filters.suchbegriff) {
        const term = filters.suchbegriff.toLowerCase();
        suchMatch =
          prompt.titel.toLowerCase().includes(term) ||
          prompt.beschreibung.toLowerCase().includes(term) ||
          prompt.promptText.toLowerCase().includes(term) ||
          (prompt.tags || []).some(tag => tag.toLowerCase().includes(term));
      }

      const plattformMatch = !filters.filterPlattform ||
        Object.keys(prompt.plattformenUndModelle || {}).includes(filters.filterPlattform);

      const outputMatch = !filters.filterOutputFormat ||
        (prompt.outputFormate || []).includes(filters.filterOutputFormat);

      const anwendungMatch = !filters.filterAnwendungsfall ||
        (prompt.anwendungsfaelle || []).includes(filters.filterAnwendungsfall) ||
        (prompt.anwendungsfaelle || []).some((anw: string) => {
          for (const [hauptkat, unterkat] of Object.entries(ANWENDUNGSFAELLE)) {
            if (hauptkat === filters.filterAnwendungsfall && unterkat.includes(anw)) {
              return true;
            }
          }
          return false;
        });

      const tagMatch = !filters.filterTag ||
        (prompt.tags || []).includes(filters.filterTag);

      const rolleMatch = !filters.filterRolle ||
        prompt.erstelltVonRolle === filters.filterRolle ||
        (typeof prompt.erstelltVonRolle === 'string' &&
          prompt.erstelltVonRolle.split(',').map(r => r.trim()).includes(filters.filterRolle));

      // Bildungsstufe: match with or without emoji prefix, comma-separated
      const bildungsstufeMatch = !filters.filterBildungsstufe || (() => {
        const bs = prompt.bildungsstufe;
        if (!bs) return false;
        const filterVal = filters.filterBildungsstufe.toLowerCase();
        // Split comma-separated values and check each
        const values = typeof bs === 'string' ? bs.split(',').map(v => v.trim().toLowerCase()) : [String(bs).toLowerCase()];
        return values.some(v => v.includes(filterVal) || filterVal.includes(v));
      })();

      return suchMatch && plattformMatch && outputMatch && anwendungMatch && tagMatch && rolleMatch && bildungsstufeMatch;
    });
  }, [prompts, filters]);

  const sortedPrompts = useMemo(() => {
    return [...filteredPrompts].sort((a, b) => {
      if (filters.sortierung === 'nutzung') {
        return (b.nutzungsanzahl || 0) - (a.nutzungsanzahl || 0);
      } else if (filters.sortierung === 'bewertung') {
        const summeA = Object.values(a.bewertungen || {}).reduce((sum, val) => sum + val, 0);
        const summeB = Object.values(b.bewertungen || {}).reduce((sum, val) => sum + val, 0);
        return summeB - summeA;
      } else {
        // Support both Firestore timestamp {seconds} and ISO string
        const getTime = (ts: unknown): number => {
          if (!ts) return 0;
          if (typeof ts === 'object' && 'seconds' in (ts as Record<string, unknown>)) {
            return (ts as { seconds: number }).seconds;
          }
          if (typeof ts === 'string') {
            return new Date(ts).getTime() / 1000;
          }
          return 0;
        };
        return getTime(b.erstelltAm) - getTime(a.erstelltAm);
      }
    });
  }, [filteredPrompts, filters.sortierung]);

  const allTags = useMemo(() =>
    Array.from(new Set(prompts.flatMap(p => p.tags || []))).sort(),
    [prompts]
  );

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => key !== 'sortierung' && value !== ''
  );

  return {
    filters, sortedPrompts, allTags,
    updateFilter, resetFilters, hasActiveFilters,
    totalCount: prompts.length,
    filteredCount: sortedPrompts.length
  };
}
