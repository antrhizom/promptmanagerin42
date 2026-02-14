'use client';

import Link from 'next/link';
import { useAuthContext } from '@/components/auth/AuthContext';
import styles from './Header.module.css';

interface HeaderProps {
  onLoginClick?: () => void;
  onCreateClick?: () => void;
}

export function Header({ onLoginClick, onCreateClick }: HeaderProps) {
  const { isAuthenticated, username, isAdmin, logoutUser, logoutAdmin } = useAuthContext();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Prompt Managerin
        </Link>

        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Prompts</Link>
          <Link href="/admin" className={styles.navLink}>Dashboard</Link>

          {isAdmin && onCreateClick && (
            <button className={styles.btnPrimary} onClick={onCreateClick}>
              + Neuer Prompt
            </button>
          )}

          {isAuthenticated && (
            <span className={styles.userPill}>
              {username}
            </span>
          )}

          {isAdmin && (
            <span className={styles.adminBadge}>Admin</span>
          )}

          {!isAuthenticated && !isAdmin && onLoginClick && (
            <button className={styles.btnGhost} onClick={onLoginClick}>
              Anmelden
            </button>
          )}

          {isAuthenticated && !isAdmin && (
            <button className={styles.btnGhost} onClick={logoutUser}>
              Abmelden
            </button>
          )}

          {isAdmin && (
            <button className={styles.btnGhost} onClick={logoutAdmin}>
              Admin Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
