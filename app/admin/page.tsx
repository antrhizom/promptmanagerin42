'use client';

import { PageLayout } from '@/components/layout/PageLayout';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { StatsDashboard } from '@/components/stats/StatsDashboard';
import { usePrompts } from '@/lib/hooks/usePrompts';

function AdminDashboard() {
  const { prompts, loading } = usePrompts();
  return <StatsDashboard prompts={prompts} loading={loading} />;
}

export default function AdminPage() {
  return (
    <PageLayout>
      <AdminGuard>
        <AdminDashboard />
      </AdminGuard>
    </PageLayout>
  );
}
