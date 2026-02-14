'use client';

import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { useAuthContext } from './AuthContext';
import { generiereIndividuellenCode } from '@/lib/utils/generateCode';
import styles from './UserLoginModal.module.css';

interface UserLoginModalProps {
  onClose: () => void;
}

export function UserLoginModal({ onClose }: UserLoginModalProps) {
  const { loginWithCode, checkAndLoadUser } = useAuthContext();
  const [mode, setMode] = useState<'choose' | 'existing' | 'new'>('choose');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [generatedCode] = useState(() => generiereIndividuellenCode());
  const [loadedName, setLoadedName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCodeChange = async (value: string) => {
    const upperCode = value.toUpperCase();
    setCode(upperCode);
    setLoadedName(null);

    if (upperCode.length >= 6) {
      const foundName = await checkAndLoadUser(upperCode);
      if (foundName) {
        setLoadedName(foundName);
        setName(foundName);
      }
    }
  };

  const handleSubmit = async () => {
    const finalCode = mode === 'new' ? generatedCode : code;
    if (!name.trim()) {
      alert('Bitte gib einen Namen ein.');
      return;
    }
    if (mode === 'existing' && finalCode.length < 6) {
      alert('Bitte gib einen gultigen 6-stelligen Code ein.');
      return;
    }

    setSubmitting(true);
    try {
      await loginWithCode(finalCode, name);
      onClose();
    } catch {
      alert('Fehler beim Anmelden. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      {mode === 'choose' && (
        <>
          <h2 className={styles.title}>Willkommen bei der Prompt Managerin</h2>
          <p className={styles.subtitle}>
            Melde dich an, um Prompts zu bewerten und zu kommentieren. Dein Name wird bei deinen Kommentaren angezeigt.
          </p>
          <div className={styles.options}>
            <button className={styles.optionBtn} onClick={() => setMode('existing')}>
              <div className={styles.optionTitle}>Ich habe schon einen Code</div>
              <div className={styles.optionDesc}>Melde dich mit deinem bestehenden Zugangscode an</div>
            </button>
            <button className={styles.optionBtn} onClick={() => setMode('new')}>
              <div className={styles.optionTitle}>Neuen Account erstellen</div>
              <div className={styles.optionDesc}>Erhalte einen neuen Zugangscode zum Bewerten und Kommentieren</div>
            </button>
          </div>
          <button className={styles.cancelBtn} onClick={onClose}>Abbrechen</button>
        </>
      )}

      {mode === 'existing' && (
        <>
          <button className={styles.backBtn} onClick={() => setMode('choose')}>
            &larr; Zuruck
          </button>
          <h2 className={styles.title}>Mit Code anmelden</h2>
          <p className={styles.subtitle}>Gib deinen gespeicherten 6-stelligen Zugangscode ein.</p>

          <div className={styles.field}>
            <label className={styles.label}>Zugangscode</label>
            <input
              className={styles.input}
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="z.B. ABC123"
              maxLength={6}
            />
            {loadedName && (
              <div className={styles.nameLoaded}>Willkommen zuruck, {loadedName}!</div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name"
            />
          </div>

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting || code.length < 6 || !name.trim()}
          >
            {submitting ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
          <button className={styles.cancelBtn} onClick={onClose}>Abbrechen</button>
        </>
      )}

      {mode === 'new' && (
        <>
          <button className={styles.backBtn} onClick={() => setMode('choose')}>
            &larr; Zuruck
          </button>
          <h2 className={styles.title}>Neuer Account</h2>
          <p className={styles.subtitle}>Dein persönlicher Zugangscode wurde generiert.</p>

          <div className={styles.codeDisplay}>
            <div className={styles.codeValue}>{generatedCode}</div>
            <div className={styles.codeWarning}>⚠️ Bitte speichere diesen Code! Er ist dein einziger Zugangsschlüssel und kann nicht wiederhergestellt werden.</div>
            <div className={styles.codeHint}>Tipp: Kopiere den Code und speichere ihn an einem sicheren Ort (z.B. Notiz-App).</div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Dein Name (Vor- und Nachname) <span className={styles.required}>*</span></label>
            <input
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Max Muster"
            />
            <div className={styles.nameHint}>Dein Name erscheint bei deinen Kommentaren und Bewertungen.</div>
          </div>

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
          >
            {submitting ? 'Wird erstellt...' : 'Account erstellen'}
          </button>
          <button className={styles.cancelBtn} onClick={onClose}>Abbrechen</button>
        </>
      )}
    </Modal>
  );
}
