'use client';

import { FilterState } from '@/lib/types';
import {
  PLATTFORMEN_MIT_MODELLEN_UND_FUNKTIONEN,
  OUTPUT_FORMATE,
  ANWENDUNGSFAELLE,
  ROLLEN
} from '@/lib/constants';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  filters: FilterState;
  allTags: string[];
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
}

export function FilterBar({
  filters, allTags, onFilterChange, onReset,
  hasActiveFilters, filteredCount, totalCount
}: FilterBarProps) {
  const allAnwendungsfaelle = Object.entries(ANWENDUNGSFAELLE).flatMap(
    ([kategorie, unterkategorien]) => [kategorie, ...unterkategorien]
  );

  return (
    <section className={styles.section} id="prompts-liste">
      <div className={styles.header}>
        <h2 className={styles.title}>
          Prompts durchsuchen
          <span className={styles.count}> ({filteredCount}{hasActiveFilters ? ` von ${totalCount}` : ''})</span>
        </h2>
        {hasActiveFilters && (
          <button className={styles.resetBtn} onClick={onReset}>
            Filter zurucksetzen
          </button>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>&#128269;</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Suche nach Titel, Beschreibung, Text oder #Tag..."
            value={filters.suchbegriff}
            onChange={(e) => onFilterChange('suchbegriff', e.target.value)}
          />
        </div>

        <select
          className={styles.select}
          value={filters.filterPlattform}
          onChange={(e) => onFilterChange('filterPlattform', e.target.value)}
        >
          <option value="">Alle Plattformen</option>
          {Object.keys(PLATTFORMEN_MIT_MODELLEN_UND_FUNKTIONEN).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          className={styles.select}
          value={filters.filterOutputFormat}
          onChange={(e) => onFilterChange('filterOutputFormat', e.target.value)}
        >
          <option value="">Alle Formate</option>
          {OUTPUT_FORMATE.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <select
          className={styles.select}
          value={filters.filterAnwendungsfall}
          onChange={(e) => onFilterChange('filterAnwendungsfall', e.target.value)}
        >
          <option value="">Alle Anwendungsfalle</option>
          {allAnwendungsfaelle.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select
          className={styles.select}
          value={filters.filterTag}
          onChange={(e) => onFilterChange('filterTag', e.target.value)}
        >
          <option value="">Alle Tags</option>
          {allTags.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          className={styles.select}
          value={filters.filterRolle}
          onChange={(e) => onFilterChange('filterRolle', e.target.value)}
        >
          <option value="">Alle Rollen</option>
          {ROLLEN.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          className={styles.select}
          value={filters.sortierung}
          onChange={(e) => onFilterChange('sortierung', e.target.value)}
        >
          <option value="aktuell">Neueste zuerst</option>
          <option value="bewertung">Beste Bewertung</option>
          <option value="nutzung">Meiste Nutzung</option>
        </select>
      </div>
    </section>
  );
}
