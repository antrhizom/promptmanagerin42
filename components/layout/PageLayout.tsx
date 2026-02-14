'use client';

import { Header } from './Header';
import { Footer } from './Footer';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  children: React.ReactNode;
  onLoginClick?: () => void;
  onCreateClick?: () => void;
}

export function PageLayout({ children, onLoginClick, onCreateClick }: PageLayoutProps) {
  return (
    <div className={styles.layout}>
      <Header onLoginClick={onLoginClick} onCreateClick={onCreateClick} />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
