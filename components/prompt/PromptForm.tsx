'use client';

import { useState, useEffect } from 'react';
import { Prompt } from '@/lib/types';
import {
  PLATTFORMEN_MIT_MODELLEN_UND_FUNKTIONEN,
  OUTPUT_FORMATE,
  ANWENDUNGSFAELLE,
  ROLLEN,
  BILDUNGSSTUFEN
} from '@/lib/constants';
import { useAuthContext } from '@/components/auth/AuthContext';
import styles from './PromptForm.module.css';

interface PromptFormProps {
  editingPrompt?: Prompt | null;
  onSubmit: (data: Partial<Prompt>) => Promise<void>;
  onCancel: () => void;
}

export function PromptForm({ editingPrompt, onSubmit, onCancel }: PromptFormProps) {
  const { userCode } = useAuthContext();
  const isEditing = !!editingPrompt;

  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [promptText, setPromptText] = useState('');
  const [zusatzinstruktionen, setZusatzinstruktionen] = useState('');
  const [plattformenUndModelle, setPlattformenUndModelle] = useState<{ [key: string]: string[] }>({});
  const [plattformFunktionen, setPlattformFunktionen] = useState<{ [key: string]: string[] }>({});
  const [outputFormate, setOutputFormate] = useState<string[]>([]);
  const [anwendungsfaelle, setAnwendungsfaelle] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [link1, setLink1] = useState('');
  const [link2, setLink2] = useState('');
  const [rollen, setRollen] = useState<string[]>([]);
  const [bildungsstufen, setBildungsstufen] = useState<string[]>([]);
  const [problemausgangslage, setProblemausgangslage] = useState('');
  const [loesungsbeschreibung, setLoesungsbeschreibung] = useState('');
  const [schwierigkeiten, setSchwierigkeiten] = useState('');
  const [endproduktLink, setEndproduktLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingPrompt) {
      setTitel(editingPrompt.titel);
      setBeschreibung(editingPrompt.beschreibung);
      setPromptText(editingPrompt.promptText);
      setZusatzinstruktionen(editingPrompt.zusatzinstruktionen || '');
      setPlattformenUndModelle(editingPrompt.plattformenUndModelle || {});
      setPlattformFunktionen(editingPrompt.plattformFunktionen || {});
      setOutputFormate(editingPrompt.outputFormate || []);
      setAnwendungsfaelle(editingPrompt.anwendungsfaelle || []);
      setTags(editingPrompt.tags?.join(', ') || '');
      setLink1(editingPrompt.link1 || '');
      setLink2(editingPrompt.link2 || '');
      // Backward compat: alte Prompts haben einen einzelnen String
      const existingRolle = editingPrompt.erstelltVonRolle || '';
      if (existingRolle) {
        setRollen(existingRolle.includes(',') ? existingRolle.split(',').map(r => r.trim()) : [existingRolle]);
      }
      // Backward compat: alte Prompts haben einen einzelnen String
      const existingBildung = editingPrompt.bildungsstufe || '';
      if (existingBildung) {
        setBildungsstufen(existingBildung.includes(',') ? existingBildung.split(',').map(b => b.trim()) : [existingBildung]);
      }
      setProblemausgangslage(editingPrompt.problemausgangslage || '');
      setLoesungsbeschreibung(editingPrompt.loesungsbeschreibung || '');
      setSchwierigkeiten(editingPrompt.schwierigkeiten || '');
      setEndproduktLink(editingPrompt.endproduktLink || '');
    }
  }, [editingPrompt]);

  const toggleRolle = (r: string) => {
    setRollen(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  const toggleAlleRollen = () => {
    setRollen(prev =>
      prev.length === ROLLEN.length ? [] : [...ROLLEN]
    );
  };

  const toggleBildungsstufe = (b: string) => {
    setBildungsstufen(prev =>
      prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
    );
  };

  const toggleAlleBildungsstufen = () => {
    setBildungsstufen(prev =>
      prev.length === BILDUNGSSTUFEN.length ? [] : [...BILDUNGSSTUFEN]
    );
  };

  const toggleModell = (plattform: string, modell: string) => {
    setPlattformenUndModelle(prev => {
      const aktuelle = prev[plattform] || [];
      const neue = aktuelle.includes(modell)
        ? aktuelle.filter(m => m !== modell)
        : [...aktuelle, modell];
      if (neue.length === 0) {
        const { [plattform]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [plattform]: neue };
    });
  };

  const toggleAlleModelle = (plattform: string, alleModelle: string[]) => {
    setPlattformenUndModelle(prev => {
      const aktuelle = prev[plattform] || [];
      if (aktuelle.length === alleModelle.length) {
        // Alle abwahlen
        const { [plattform]: _, ...rest } = prev;
        return rest;
      }
      // Alle auswahlen
      return { ...prev, [plattform]: [...alleModelle] };
    });
  };

  const toggleFunktion = (plattform: string, funktion: string) => {
    setPlattformFunktionen(prev => {
      const aktuelle = prev[plattform] || [];
      const neue = aktuelle.includes(funktion)
        ? aktuelle.filter(f => f !== funktion)
        : [...aktuelle, funktion];
      if (neue.length === 0) {
        const { [plattform]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [plattform]: neue };
    });
  };

  const toggleAlleFunktionen = (plattform: string, alleFunktionen: string[]) => {
    setPlattformFunktionen(prev => {
      const aktuelle = prev[plattform] || [];
      if (aktuelle.length === alleFunktionen.length) {
        const { [plattform]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [plattform]: [...alleFunktionen] };
    });
  };

  const toggleFormat = (format: string) => {
    setOutputFormate(prev =>
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const toggleAlleFormate = () => {
    setOutputFormate(prev =>
      prev.length === OUTPUT_FORMATE.length ? [] : [...OUTPUT_FORMATE]
    );
  };

  const toggleAnwendungsfall = (fall: string) => {
    setAnwendungsfaelle(prev =>
      prev.includes(fall) ? prev.filter(f => f !== fall) : [...prev, fall]
    );
  };

  const toggleAlleAnwendungsfaelle = () => {
    const alle = Object.values(ANWENDUNGSFAELLE).flat();
    setAnwendungsfaelle(prev =>
      prev.length === alle.length ? [] : [...alle]
    );
  };

  const handleSubmit = async () => {
    if (!titel.trim() || !promptText.trim()) {
      alert('Titel und Prompt-Text sind Pflichtfelder!');
      return;
    }
    if (rollen.length === 0) {
      alert('Bitte mindestens eine Rolle auswahlen!');
      return;
    }
    if (bildungsstufen.length === 0) {
      alert('Bitte mindestens eine Bildungsstufe auswahlen!');
      return;
    }
    if (Object.keys(plattformenUndModelle).length === 0) {
      alert('Bitte mindestens eine Plattform mit Modell auswahlen!');
      return;
    }
    if (outputFormate.length === 0) {
      alert('Bitte mindestens ein Output-Format auswahlen!');
      return;
    }
    if (anwendungsfaelle.length === 0) {
      alert('Bitte mindestens einen Anwendungsfall auswahlen!');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        titel: titel.trim(),
        beschreibung: beschreibung.trim(),
        promptText: promptText.trim(),
        ...(zusatzinstruktionen.trim() && { zusatzinstruktionen: zusatzinstruktionen.trim() }),
        plattformenUndModelle,
        ...(Object.keys(plattformFunktionen).length > 0 && { plattformFunktionen }),
        outputFormate,
        anwendungsfaelle,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        link1: link1.trim(),
        link2: link2.trim(),
        erstelltVon: editingPrompt?.erstelltVon || userCode,
        erstelltVonRolle: rollen.join(', '),
        bildungsstufe: bildungsstufen.join(', '),
        ...(problemausgangslage.trim() && { problemausgangslage: problemausgangslage.trim() }),
        ...(loesungsbeschreibung.trim() && { loesungsbeschreibung: loesungsbeschreibung.trim() }),
        ...(schwierigkeiten.trim() && { schwierigkeiten: schwierigkeiten.trim() }),
        ...(endproduktLink.trim() && { endproduktLink: endproduktLink.trim() }),
      });
      alert(isEditing ? 'Prompt erfolgreich aktualisiert!' : 'Prompt erfolgreich gespeichert!');
      onCancel();
    } catch (error) {
      console.error('Fehler:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.form}>
      <h2 className={styles.formTitle}>{isEditing ? 'Prompt bearbeiten' : 'Neuer Prompt'}</h2>

      {/* Rollen - Multi-Select mit Checkboxen */}
      <div className={`${styles.fieldGroup} ${styles.sectionBox} ${styles.sectionRollen}`}>
        <div className={styles.sectionHeader}>
          <label className={styles.label}>
            Rolle(n)<span className={styles.required}>*</span>
            {rollen.length > 0 && ` (${rollen.length} gewählt)`}
          </label>
          <button type="button" className={styles.selectAllBtn} onClick={toggleAlleRollen}>
            {rollen.length === ROLLEN.length ? 'Alle abwählen' : 'Alle auswählen'}
          </button>
        </div>
        <div className={styles.rolleGrid}>
          {ROLLEN.map(r => (
            <label key={r} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rollen.includes(r)}
                onChange={() => toggleRolle(r)}
              />
              {r}
            </label>
          ))}
        </div>
      </div>

      {/* Bildungsstufe - Multi-Select mit Checkboxen */}
      <div className={`${styles.fieldGroup} ${styles.sectionBox} ${styles.sectionBildung}`}>
        <div className={styles.sectionHeader}>
          <label className={styles.label}>
            Bildungsstufe(n)<span className={styles.required}>*</span>
            {bildungsstufen.length > 0 && ` (${bildungsstufen.length} gewählt)`}
          </label>
          <button type="button" className={styles.selectAllBtn} onClick={toggleAlleBildungsstufen}>
            {bildungsstufen.length === BILDUNGSSTUFEN.length ? 'Alle abwählen' : 'Alle auswählen'}
          </button>
        </div>
        <div className={styles.rolleGrid}>
          {BILDUNGSSTUFEN.map(b => (
            <label key={b} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={bildungsstufen.includes(b)}
                onChange={() => toggleBildungsstufe(b)}
              />
              {b}
            </label>
          ))}
        </div>
      </div>

      {/* Textfelder in dezenter Box */}
      <div className={styles.sectionTextfelder}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Titel<span className={styles.required}>*</span></label>
          <input className={styles.input} type="text" value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Titel des Prompts" />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Beschreibung</label>
          <input className={styles.input} type="text" value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} placeholder="Kurze Beschreibung (optional)" />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Prompt-Text<span className={styles.required}>*</span></label>
          <textarea className={styles.textarea} value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="Der eigentliche Prompt..." />
        </div>

        <div className={styles.fieldGroup} style={{ marginBottom: 0 }}>
          <label className={styles.label}>Zusatzinstruktionen</label>
          <textarea className={styles.textarea} value={zusatzinstruktionen} onChange={(e) => setZusatzinstruktionen(e.target.value)} placeholder="Optionale Zusatzinstruktionen..." style={{ minHeight: '80px' }} />
        </div>
      </div>

      {/* Platforms & Models - mit "Alle auswahlen" */}
      <details className={`${styles.accordion} ${styles.accordionPlattformen}`}>
        <summary className={styles.accordionSummary}>
          Plattformen &amp; Modelle<span className={styles.required}>*</span>
          {Object.keys(plattformenUndModelle).length > 0 && ` (${Object.keys(plattformenUndModelle).length} Plattformen)`}
        </summary>
        <div className={styles.accordionContent}>
          {Object.entries(PLATTFORMEN_MIT_MODELLEN_UND_FUNKTIONEN).map(([plattform, data]) => (
            <div key={plattform} className={styles.platformSection}>
              <div className={styles.platformTitle}>{plattform}</div>

              <div className={styles.subTitle}>
                Modelle
                <button
                  type="button"
                  className={styles.selectAllBtn}
                  onClick={() => toggleAlleModelle(plattform, data.modelle)}
                  style={{ marginLeft: '8px' }}
                >
                  {(plattformenUndModelle[plattform] || []).length === data.modelle.length ? 'Alle abwahlen' : 'Alle auswahlen'}
                </button>
              </div>
              <div className={styles.checkboxGrid}>
                {data.modelle.map(modell => (
                  <label key={modell} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={(plattformenUndModelle[plattform] || []).includes(modell)}
                      onChange={() => toggleModell(plattform, modell)}
                    />
                    {modell}
                  </label>
                ))}
              </div>

              <div className={styles.subTitle}>
                Funktionen
                <button
                  type="button"
                  className={styles.selectAllBtn}
                  onClick={() => toggleAlleFunktionen(plattform, data.funktionen)}
                  style={{ marginLeft: '8px' }}
                >
                  {(plattformFunktionen[plattform] || []).length === data.funktionen.length ? 'Alle abwahlen' : 'Alle auswahlen'}
                </button>
              </div>
              <div className={styles.checkboxGrid}>
                {data.funktionen.map(fn => (
                  <label key={fn} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={(plattformFunktionen[plattform] || []).includes(fn)}
                      onChange={() => toggleFunktion(plattform, fn)}
                    />
                    {fn}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Output formats - mit "Alle auswahlen" */}
      <details className={`${styles.accordion} ${styles.accordionFormate}`}>
        <summary className={styles.accordionSummary}>
          Output-Formate<span className={styles.required}>*</span>
          {outputFormate.length > 0 && ` (${outputFormate.length} gewahlt)`}
        </summary>
        <div className={styles.accordionContent}>
          <div className={styles.selectAllRow}>
            <button type="button" className={styles.selectAllBtn} onClick={toggleAlleFormate}>
              {outputFormate.length === OUTPUT_FORMATE.length ? 'Alle abwahlen' : 'Alle auswahlen'}
            </button>
          </div>
          <div className={styles.checkboxGrid}>
            {OUTPUT_FORMATE.map(format => (
              <label key={format} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={outputFormate.includes(format)}
                  onChange={() => toggleFormat(format)}
                />
                {format}
              </label>
            ))}
          </div>
        </div>
      </details>

      {/* Use cases - mit "Alle auswahlen" */}
      <details className={`${styles.accordion} ${styles.accordionAnwendung}`}>
        <summary className={styles.accordionSummary}>
          Anwendungsfälle<span className={styles.required}>*</span>
          {anwendungsfaelle.length > 0 && ` (${anwendungsfaelle.length} gewahlt)`}
        </summary>
        <div className={styles.accordionContent}>
          <div className={styles.selectAllRow}>
            <button type="button" className={styles.selectAllBtn} onClick={toggleAlleAnwendungsfaelle}>
              {anwendungsfaelle.length === Object.values(ANWENDUNGSFAELLE).flat().length ? 'Alle abwahlen' : 'Alle auswahlen'}
            </button>
          </div>
          {Object.entries(ANWENDUNGSFAELLE).map(([kategorie, unterkategorien]) => (
            <div key={kategorie} style={{ marginBottom: 'var(--space-4)' }}>
              <div className={styles.subTitle}>{kategorie}</div>
              <div className={styles.checkboxGrid}>
                {unterkategorien.map(fall => (
                  <label key={fall} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={anwendungsfaelle.includes(fall)}
                      onChange={() => toggleAnwendungsfall(fall)}
                    />
                    {fall}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Tags & Links */}
      <div className={styles.sectionTags}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Tags (kommagetrennt)</label>
          <input className={styles.input} type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="z.B. Mathematik, Grammatik, Kreativität" />
        </div>

        <div className={styles.linkRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Link 1</label>
            <input className={styles.input} type="url" value={link1} onChange={(e) => setLink1(e.target.value)} placeholder="https://..." />
          </div>
          <div className={styles.fieldGroup} style={{ marginBottom: 0 }}>
            <label className={styles.label}>Link 2</label>
            <input className={styles.input} type="url" value={link2} onChange={(e) => setLink2(e.target.value)} placeholder="https://..." />
          </div>
        </div>
      </div>

      {/* Problemsituation/Kontextualisierung */}
      <details className={`${styles.accordion} ${styles.accordionProblem}`}>
        <summary className={styles.accordionSummary}>Problemsituation / Kontextualisierung (optional)</summary>
        <div className={styles.accordionContent}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Problemausgangslage</label>
            <textarea className={styles.textareaSmall} value={problemausgangslage} onChange={(e) => setProblemausgangslage(e.target.value)} placeholder="Welches Problem wurde gelost?" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Losungsbeschreibung</label>
            <textarea className={styles.textareaSmall} value={loesungsbeschreibung} onChange={(e) => setLoesungsbeschreibung(e.target.value)} placeholder="Wie wurde das Problem gelost?" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Schwierigkeiten</label>
            <textarea className={styles.textareaSmall} value={schwierigkeiten} onChange={(e) => setSchwierigkeiten(e.target.value)} placeholder="Welche Schwierigkeiten gab es?" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Endprodukt-Link</label>
            <input className={styles.input} type="url" value={endproduktLink} onChange={(e) => setEndproduktLink(e.target.value)} placeholder="https://..." />
          </div>
        </div>
      </details>

      {/* Buttons */}
      <div className={styles.buttonRow}>
        <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Wird gespeichert...' : (isEditing ? 'Aktualisieren' : 'Prompt speichern')}
        </button>
        <button className={styles.cancelBtn} onClick={onCancel}>Abbrechen</button>
      </div>
    </div>
  );
}
