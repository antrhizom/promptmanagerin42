import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.info}>
          <span className={styles.title}>Prompt Managerin</span>
          <span className={styles.subtitle}>
            Erprobte KI-Prompts fur Bildungszwecke
          </span>
        </div>
        <div className={styles.links}>
          <Link href="/" className={styles.link}>Prompts</Link>
          <Link href="/admin" className={styles.link}>Dashboard</Link>
          <Link href="/admin-login" className={styles.adminLink}>Admin-Bereich</Link>
        </div>
      </div>
    </footer>
  );
}
