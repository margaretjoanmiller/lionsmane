import { createFileRoute } from '@tanstack/react-router';
import { $api } from '@/lib/fetch-client';
import { ArticleCard } from '@/components/article-card';

export const Route = createFileRoute('/dashboard/')({
  component: DashIndex,
});

function DashIndex() {
  const { data, isLoading } = $api.useQuery('get', '/article', {
    credentials: 'include',
  });
  if (isLoading || !data) return 'Loading...';

  const articles = data.articles.map((i) => {
    return <ArticleCard article={i} />;
  });

  return <>{articles}</>;
}
