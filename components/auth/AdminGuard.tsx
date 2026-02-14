'use client';

import { useAuthContext } from './AuthContext';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, adminLoading } = useAuthContext();

  if (adminLoading) {
    return (
      <div style={{ padding: 'var(--space-16)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
        Laden...
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}
