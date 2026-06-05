'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from './AuthContext';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, adminLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.replace('/admin-login');
    }
  }, [adminLoading, isAdmin, router]);

  if (adminLoading) {
    return (
      <div style={{ padding: 'var(--space-16)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
        Laden...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 'var(--space-16)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
        Kein Zugriff. Weiterleitung zum Admin-Login...
      </div>
    );
  }

  return <>{children}</>;
}
