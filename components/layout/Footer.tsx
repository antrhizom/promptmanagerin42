import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.info}>
          <span className={styles.title}>Promptmanagerin</span>
          <span className={styles.subtitle}>
            Erprobte KI-Prompts fur Bildungszwecke
          </span>
        </div>
        <div className={styles.links}>
          <Link href="/" className={styles.link}>Prompts</Link>
          <Link href="/ki-tools" className={styles.link}>Gen Biblio</Link>
          <Link href="/datenschutz" className={styles.link}>Datenschutz</Link>
          <Link href="/admin-login" className={styles.adminLink}>Admin-Bereich</Link>
        </div>
      </div>

      <div
        style={{
          maxWidth: 'var(--max-width)',
          margin: 'var(--space-8) auto 0',
          paddingTop: 'var(--space-6)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-gray-500)',
          textAlign: 'center',
          lineHeight: 1.7,
        }}
      >
        <strong style={{ color: 'var(--color-gray-300)' }}>Impressum</strong>{' '}
        <a
          href="https://dlh.zh.ch"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-gray-300)', textDecoration: 'underline' }}
        >
          Digital Learning Hub (DLH)
        </a>{' '}
        · Erstellt durch die Arbeitsgruppe «Team KI»
      </div>
    </footer>
  );
}
