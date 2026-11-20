'use client';

import { useState } from 'react';
import { OUTPUTS, OUTPUT_TYPEN, OutputEintrag, OutputTyp, anpassPromptFuer } from '@/lib/outputs';
import { trackAction } from '@/lib/analytics';
import styles from './OutputSammlung.module.css';

interface OutputSammlungProps {
  groessen: Record<string, number>; // Bytes je slug
}

function formatGroesse(bytes: number | undefined): string | null {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function kopiere(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type Ansicht = 'vorschau' | 'code' | null;
type Breite = 'breit' | 'handy';

function OutputKarte({ eintrag, typ, groesse }: { eintrag: OutputEintrag; typ: OutputTyp; groesse?: number }) {
  const [ansicht, setAnsicht] = useState<Ansicht>(null);
  const [breite, setBreite] = useState<Breite>('breit');
  const [code, setCode] = useState<string | null>(null);
  const [codeFehler, setCodeFehler] = useState(false);
  const [kopiert, setKopiert] = useState<'code' | 'prompt' | null>(null);

  const dateiName = `${eintrag.slug}.${typ.endung}`;
  const prompt = anpassPromptFuer(eintrag);
  const groesseText = formatGroesse(groesse);

  const ladeCode = async (): Promise<string | null> => {
    if (code !== null) return code;
    try {
      const res = await fetch(eintrag.datei);
      if (!res.ok) throw new Error(String(res.status));
      const text = await res.text();
      setCode(text);
      setCodeFehler(false);
      return text;
    } catch {
      setCodeFehler(true);
      return null;
    }
  };

  const zeige = (ziel: Exclude<Ansicht, null>) => {
    if (ansicht === ziel) {
      setAnsicht(null);
      return;
    }
    setAnsicht(ziel);
    // Vorschau und Code-Ansicht nutzen denselben geladenen Quelltext.
    void ladeCode();
    trackAction(ziel === 'code' ? 'output-code-angezeigt' : 'output-vorschau');
  };

  const meldeKopiert = (was: 'code' | 'prompt') => {
    setKopiert(was);
    window.setTimeout(() => setKopiert(aktuell => (aktuell === was ? null : aktuell)), 2000);
  };

  const kopiereCode = async () => {
    const text = await ladeCode();
    if (text && (await kopiere(text))) {
      meldeKopiert('code');
      trackAction('output-code-kopiert');
    }
  };

  const kopierePrompt = async () => {
    if (await kopiere(prompt)) {
      meldeKopiert('prompt');
      trackAction('output-prompt-kopiert');
    }
  };

  return (
    <article className={styles.karte}>
      <div className={styles.kopf}>
        <span className={styles.typBadge}>{typ.label}</span>
        <h3 className={styles.titel}>{eintrag.titel}</h3>
      </div>

      <p className={styles.beschreibung}>{eintrag.beschreibung}</p>

      <p className={styles.meta}>
        {[
          eintrag.erstelltMit ? `Erstellt mit ${eintrag.erstelltMit}` : null,
          eintrag.autor || null,
          eintrag.lizenz ? `Lizenz ${eintrag.lizenz}` : null,
          groesseText ? `${dateiName} · ${groesseText}` : dateiName,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>

      {eintrag.tags.length > 0 && (
        <div className={styles.tags}>
          {eintrag.tags.map(tag => (
            <span key={tag} className={styles.tag}>#{tag}</span>
          ))}
        </div>
      )}

      <div className={styles.aktionen}>
        {typ.vorschau && (
          <button
            type="button"
            className={styles.btnPrimaer}
            aria-expanded={ansicht === 'vorschau'}
            onClick={() => zeige('vorschau')}
          >
            {ansicht === 'vorschau' ? 'Vorschau schliessen' : 'Ansehen'}
          </button>
        )}
        <a
          className={styles.btn}
          href={eintrag.datei}
          download={dateiName}
          onClick={() => trackAction('output-download')}
        >
          Herunterladen
        </a>
        <button
          type="button"
          className={styles.btn}
          aria-expanded={ansicht === 'code'}
          onClick={() => zeige('code')}
        >
          {ansicht === 'code' ? 'Code schliessen' : 'Code anzeigen'}
        </button>
        {typ.vorschau && (
          <a
            className={styles.btnText}
            href={eintrag.datei}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAction('output-neuer-tab')}
          >
            In neuem Tab öffnen ↗
          </a>
        )}
      </div>

      {ansicht === 'vorschau' && (
        <div className={styles.vorschau}>
          <div className={styles.vorschauLeiste}>
            <span className={styles.vorschauTitel}>Vorschau</span>
            <div className={styles.umschalter} role="group" aria-label="Breite der Vorschau">
              <button
                type="button"
                className={breite === 'breit' ? styles.umschalterAktiv : styles.umschalterKnopf}
                aria-pressed={breite === 'breit'}
                onClick={() => setBreite('breit')}
              >
                Bildschirm
              </button>
              <button
                type="button"
                className={breite === 'handy' ? styles.umschalterAktiv : styles.umschalterKnopf}
                aria-pressed={breite === 'handy'}
                onClick={() => setBreite('handy')}
              >
                Handy
              </button>
            </div>
          </div>
          {codeFehler ? (
            <p className={styles.hinweis}>
              Die Vorschau konnte nicht geladen werden. Über «In neuem Tab öffnen» lässt sich der
              Output trotzdem ansehen.
            </p>
          ) : code === null ? (
            <p className={styles.hinweis}>Vorschau wird geladen …</p>
          ) : (
            <div className={styles.rahmenFlaeche}>
              {/* Der Quelltext wird direkt in den Rahmen geschrieben (srcDoc). Sandbox ohne
                  allow-same-origin: Scripts laufen, aber ohne Zugriff auf die Promptmanagerin. */}
              <iframe
                className={breite === 'handy' ? styles.rahmenHandy : styles.rahmen}
                srcDoc={code}
                title={`Vorschau: ${eintrag.titel}`}
                sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads"
              />
            </div>
          )}
        </div>
      )}

      {ansicht === 'code' && (
        <div className={styles.code}>
          <div className={styles.vorschauLeiste}>
            <span className={styles.vorschauTitel}>
              {dateiName}
              {code !== null && ` · ${code.split('\n').length} Zeilen`}
            </span>
            <button type="button" className={styles.btnKlein} onClick={kopiereCode}>
              {kopiert === 'code' ? 'Kopiert' : 'Code kopieren'}
            </button>
          </div>
          {codeFehler ? (
            <p className={styles.hinweis}>
              Der Code konnte nicht geladen werden. Über «Herunterladen» kommst du trotzdem an die Datei.
            </p>
          ) : code === null ? (
            <p className={styles.hinweis}>Code wird geladen …</p>
          ) : (
            <pre className={styles.codeBlock} tabIndex={0}><code>{code}</code></pre>
          )}
        </div>
      )}

      <details className={styles.weiter}>
        <summary className={styles.weiterTitel}>Weiterverwenden und anpassen</summary>
        <ol className={styles.schritte}>
          <li>Datei herunterladen oder den Code kopieren.</li>
          <li>
            In eine Chat-KI (z. B. Claude, ChatGPT, Gemini) hochladen oder einfügen, oder einem
            KI-Agenten als Datei übergeben.
          </li>
          <li>Mit diesem Prompt starten und die eckigen Klammern ersetzen:</li>
        </ol>
        <pre className={styles.promptBlock}>{prompt}</pre>
        <button type="button" className={styles.btnKlein} onClick={kopierePrompt}>
          {kopiert === 'prompt' ? 'Kopiert' : 'Anpass-Prompt kopieren'}
        </button>
      </details>
    </article>
  );
}

export function OutputSammlung({ groessen }: OutputSammlungProps) {
  const typenMitInhalt = OUTPUT_TYPEN.filter(typ => OUTPUTS.some(o => o.typ === typ.key));

  if (typenMitInhalt.length === 0) {
    return <p className={styles.hinweis}>Noch keine Outputs hinterlegt.</p>;
  }

  return (
    <div className={styles.sammlung}>
      {typenMitInhalt.map(typ => {
        const eintraege = OUTPUTS.filter(o => o.typ === typ.key);
        return (
          <section key={typ.key} className={styles.gruppe} aria-labelledby={`output-typ-${typ.key}`}>
            <div className={styles.gruppenKopf}>
              <h2 id={`output-typ-${typ.key}`} className={styles.gruppenTitel}>
                {typ.label}
                <span className={styles.anzahl}>{eintraege.length}</span>
              </h2>
              <p className={styles.gruppenText}>{typ.beschreibung}</p>
            </div>
            <div className={styles.liste}>
              {eintraege.map(eintrag => (
                <OutputKarte
                  key={eintrag.slug}
                  eintrag={eintrag}
                  typ={typ}
                  groesse={groessen[eintrag.slug]}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
