import styles from './HeroSection.module.css';

interface HeroSectionProps {
  onJoinClick: () => void;
}

export function HeroSection({ onJoinClick }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>Promptmanagerin</h1>
      <p className={styles.subtitle}>
        Erprobte KI-Prompts fur Bildungszwecke entdecken, nutzen und liken.
        Eine kuratierte Sammlung der besten Prompts fur den Unterricht.
      </p>
      <button className={styles.cta} onClick={onJoinClick}>
        Anmelden zum Kommentieren
      </button>
      <p className={styles.ctaHint}>
        Lesen, Liken und Kopieren geht ohne Anmeldung. Zum Kommentieren bitte anmelden.
      </p>
    </section>
  );
}
