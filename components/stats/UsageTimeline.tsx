'use client';

import { useMemo, useState } from 'react';
import styles from './UsageTimeline.module.css';

export interface TimelinePoint {
  date: string; // YYYY-MM-DD (Schweizer Zeit, vom Server aggregiert)
  visitors: number;
  visits: number;
  functions: number;
  actions: number;
}

interface UsageTimelineProps {
  timeline: TimelinePoint[] | undefined;
}

type RangeKey = '14' | '30' | '90' | 'alle';

const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: '14', label: '14 Tage', days: 14 },
  { key: '30', label: '30 Tage', days: 30 },
  { key: '90', label: '90 Tage', days: 90 },
  { key: 'alle', label: 'Alle', days: null },
];

const SERIES = [
  { key: 'visits', label: 'Seitenaufrufe', color: '#3b82f6' },
  { key: 'functions', label: 'Funktions-Badges', color: '#d97706' },
  { key: 'actions', label: 'Klick-Aktionen', color: '#7c3aed' },
] as const;

// Ab dieser Anzahl Tage wird auf Wochen verdichtet, sonst werden die Balken zu dünn.
const WEEK_THRESHOLD = 70;

interface Bucket {
  label: string;
  fullLabel: string;
  visitors: number;
  visits: number;
  functions: number;
  actions: number;
  total: number;
}

function formatDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
}

function toBuckets(points: TimelinePoint[], weekly: boolean): Bucket[] {
  if (!weekly) {
    return points.map(p => ({
      label: formatDay(p.date),
      fullLabel: new Date(`${p.date}T12:00:00Z`).toLocaleDateString('de-CH', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      visitors: p.visitors,
      visits: p.visits,
      functions: p.functions,
      actions: p.actions,
      total: p.visits + p.functions + p.actions,
    }));
  }

  const weeks: Bucket[] = [];
  for (let i = 0; i < points.length; i += 7) {
    const chunk = points.slice(i, i + 7);
    const visits = chunk.reduce((s, p) => s + p.visits, 0);
    const functions = chunk.reduce((s, p) => s + p.functions, 0);
    const actions = chunk.reduce((s, p) => s + p.actions, 0);
    weeks.push({
      label: formatDay(chunk[0].date),
      fullLabel: `Woche ${formatDay(chunk[0].date)} bis ${formatDay(chunk[chunk.length - 1].date)}`,
      // Besucher je Woche sind die Summe der Tageswerte (Mehrfachbesuche an
      // verschiedenen Tagen zaehlen daher mehrfach).
      visitors: chunk.reduce((s, p) => s + p.visitors, 0),
      visits,
      functions,
      actions,
      total: visits + functions + actions,
    });
  }
  return weeks;
}

export function UsageTimeline({ timeline }: UsageTimelineProps) {
  const [range, setRange] = useState<RangeKey>('30');

  const { buckets, weekly, summary } = useMemo(() => {
    const points = timeline || [];
    const days = RANGES.find(r => r.key === range)?.days ?? null;
    const selected = days ? points.slice(-days) : points;
    const isWeekly = selected.length > WEEK_THRESHOLD;

    const totalEvents = selected.reduce(
      (s, p) => s + p.visits + p.functions + p.actions,
      0
    );
    const busiest = selected.reduce<TimelinePoint | null>((best, p) => {
      const total = p.visits + p.functions + p.actions;
      const bestTotal = best ? best.visits + best.functions + best.actions : -1;
      return total > bestTotal ? p : best;
    }, null);

    // Trend: letzte 7 Tage gegenueber den 7 Tagen davor.
    const last7 = points.slice(-7).reduce((s, p) => s + p.visits + p.functions + p.actions, 0);
    const prev7 = points.slice(-14, -7).reduce((s, p) => s + p.visits + p.functions + p.actions, 0);

    return {
      buckets: toBuckets(selected, isWeekly),
      weekly: isWeekly,
      summary: {
        totalEvents,
        perDay: selected.length > 0 ? totalEvents / selected.length : 0,
        busiest,
        last7,
        prev7,
      },
    };
  }, [timeline, range]);

  if (!timeline) {
    return (
      <div className={styles.timeline}>
        <h3 className={styles.heading}>Zeitlicher Verlauf</h3>
        <p className={styles.empty}>Verlauf wird geladen …</p>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className={styles.timeline}>
        <h3 className={styles.heading}>Zeitlicher Verlauf</h3>
        <p className={styles.empty}>Noch keine Ereignisse erfasst.</p>
      </div>
    );
  }

  const maxTotal = Math.max(1, ...buckets.map(b => b.total));
  const width = 720;
  const height = 200;
  const padLeft = 34;
  const padBottom = 22;
  const padTop = 8;
  const chartWidth = width - padLeft;
  const chartHeight = height - padBottom - padTop;
  const slot = chartWidth / Math.max(1, buckets.length);
  const barWidth = Math.max(2, Math.min(28, slot * 0.68));

  // Beschriftungen ausdünnen, damit die X-Achse lesbar bleibt.
  const labelEvery = Math.ceil(buckets.length / 12);
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  const trendDiff = summary.last7 - summary.prev7;
  const trendText =
    summary.prev7 === 0 && summary.last7 === 0
      ? 'keine Aktivität in den letzten 14 Tagen'
      : summary.prev7 === 0
        ? `${summary.last7} Ereignisse in den letzten 7 Tagen (davor keine)`
        : `${trendDiff >= 0 ? '+' : ''}${Math.round((trendDiff / summary.prev7) * 100)} % gegenüber der Vorwoche`;

  return (
    <div className={styles.timeline}>
      <div className={styles.header}>
        <h3 className={styles.heading}>Zeitlicher Verlauf</h3>
        <div className={styles.rangeButtons}>
          {RANGES.map(r => (
            <button
              key={r.key}
              type="button"
              className={r.key === range ? styles.rangeButtonActive : styles.rangeButton}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.legend}>
        {SERIES.map(s => (
          <span key={s.key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        {weekly && <span className={styles.legendNote}>pro Woche zusammengefasst</span>}
      </div>

      <div className={styles.chartWrap}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Nutzung im zeitlichen Verlauf"
      >
        {gridLines.map(g => {
          const y = padTop + chartHeight - g * chartHeight;
          return (
            <g key={g}>
              <line x1={padLeft} y1={y} x2={width} y2={y} className={styles.gridLine} />
              <text x={padLeft - 6} y={y + 3} className={styles.axisLabel} textAnchor="end">
                {Math.round(maxTotal * g)}
              </text>
            </g>
          );
        })}

        {buckets.map((b, i) => {
          const x = padLeft + i * slot + (slot - barWidth) / 2;
          let y = padTop + chartHeight;
          return (
            <g key={`${b.fullLabel}-${i}`}>
              {SERIES.map(s => {
                const value = b[s.key];
                const barHeight = (value / maxTotal) * chartHeight;
                y -= barHeight;
                if (value === 0) return null;
                return (
                  <rect
                    key={s.key}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={s.color}
                    rx={1}
                  />
                );
              })}
              <rect
                x={padLeft + i * slot}
                y={padTop}
                width={slot}
                height={chartHeight}
                fill="transparent"
              >
                <title>
                  {`${b.fullLabel}\n${b.visitors} Besucher\n${b.visits} Seitenaufrufe\n${b.functions} Funktions-Badges\n${b.actions} Klick-Aktionen`}
                </title>
              </rect>
              {i % labelEvery === 0 && (
                <text
                  x={padLeft + i * slot + slot / 2}
                  y={height - 6}
                  className={styles.axisLabel}
                  textAnchor="middle"
                >
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      </div>

      <div className={styles.summary}>
        <span>
          <strong>{summary.totalEvents}</strong> Ereignisse im gewählten Zeitraum
        </span>
        <span>
          Ø <strong>{summary.perDay.toFixed(1)}</strong> pro Tag
        </span>
        {summary.busiest && (
          <span>
            Stärkster Tag <strong>{formatDay(summary.busiest.date)}</strong> mit{' '}
            {summary.busiest.visits + summary.busiest.functions + summary.busiest.actions}
          </span>
        )}
        <span>Trend {trendText}</span>
      </div>
    </div>
  );
}
