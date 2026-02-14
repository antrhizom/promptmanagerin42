import styles from './HeroSection.module.css';

interface HeroSectionProps {
  onJoinClick: () => void;
}

export function HeroSection({ onJoinClick }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>Prompt Managerin</h1>
      <p className={styles.subtitle}>
        Erprobte KI-Prompts fur Bildungszwecke entdecken, teilen und bewerten.
        Eine Sammlung der besten Prompts fur den Unterricht.
      </p>
      <button className={styles.cta} onClick={onJoinClick}>
        Community beitreten
      </button>
      <p className={styles.ctaHint}>
        Melde dich an, um Kommentare zu schreiben und Prompts zu bewerten.
      </p>
    </section>
  );
}
