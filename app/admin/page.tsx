'use client';

import { PageLayout } from '@/components/layout/PageLayout';
import { StatsDashboard } from '@/components/stats/StatsDashboard';
import { usePrompts } from '@/lib/hooks/usePrompts';

export default function AdminPage() {
  const { prompts, loading } = usePrompts();

  return (
    <PageLayout>
      <StatsDashboard prompts={prompts} loading={loading} />
    </PageLayout>
  );
}
