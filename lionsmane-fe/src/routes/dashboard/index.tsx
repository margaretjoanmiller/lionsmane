import { createFileRoute } from '@tanstack/react-router';
import { $api } from '@/lib/fetch-client';
import { ArticleCard } from '@/components/article-card';
import {
  ArticleFilter,
  useArticleFilterStore,
} from '@/stores/articleFilter.store';

export const Route = createFileRoute('/dashboard/')({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      $api.queryOptions('get', '/article', {
        credentials: 'include',
      }),
    ),
  component: DashIndex,
});

function DashIndex() {
  const filter = useArticleFilterStore((state) => state.filter);

  if (filter === ArticleFilter.Unread) {
    const { data, isLoading } = $api.useSuspenseQuery('get', '/article', {
      credentials: 'include',
    });
    if (isLoading || !data) return 'Loading...';

    const articles = data.articles.map((i) => {
      return <ArticleCard article={i} />;
    });
    return (
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">{articles}</div>
    );
  } else if (filter === ArticleFilter.Read) {
    const { data, isLoading } = $api.useQuery('get', '/article/read', {
      credentials: 'include',
    });
    if (isLoading || !data) return 'Loading...';

    const articles = data.articles.map((i) => {
      return <ArticleCard article={i} />;
    });

    return (
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">{articles}</div>
    );
  } else if (filter === ArticleFilter.Starred) {
    const { data, isLoading } = $api.useQuery('get', '/article/starred', {
      credentials: 'include',
    });
    if (isLoading || !data) return 'Loading...';

    const articles = data.articles.map((i) => {
      return <ArticleCard article={i} />;
    });

    return (
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">{articles}</div>
    );
  }
}
